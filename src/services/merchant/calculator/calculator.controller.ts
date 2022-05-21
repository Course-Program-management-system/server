import { NextFunction } from "express";
import { HttpStatus } from "interfaces";
import { CustomRequest, CustomResponse } from "interfaces/payload.interface";
import {
  SavedReportEntity,
  SavedReportMarks,
} from "repository/entity/saved-report.entity";
import { SubjectEntity } from "repository/entity/subject-entity";
import ExamTypes from "repository/entity/subject-entity/ExamTypes.entity";
import { UserEntity } from "repository/entity/User";
import RepositoryService, { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import Utils from "utils";
import ErrorHandler from "utils/error-handler.utils";
import ResponseHandler from "utils/response-handler.util";
import CalculatorService from "./calculator.service";

interface ParsedStudentData {
  [co: number]: QuestionsMap[];
}
export interface CourseOutcomes {
  [co: number]: {
    improvementRequired: boolean;
    percentage: number;
    attempted: number;
    passedTarget: number;
    attainment: number;
    questionMarks?: number[];
  };
}
export type QuestionsMap = {
  part?: number;
  section?: any;
  co: Array<number> | number;
  maxMarks: number;
  mark?: number;
};
@autoInjectable()
export default class CalculatorController {
  constructor(
    private utils: Utils,
    private calculatorService: CalculatorService
  ) {}
  private savedReportRepository = new RepositoryService<SavedReportEntity>(
    SavedReportEntity
  );
  public generateAttainmentReport = async (
    request: CustomRequest<UserEntity>,
    response: CustomResponse<{ [RepositoryEntity.SUBJECT]: SubjectEntity }>,
    next: NextFunction
  ) => {
    try {
      const subject = response.locals.data[RepositoryEntity.SUBJECT];
      const examType = request["examType"];
      const questionSection = await this.getSections(
        request,
        subject,
        examType
      );
      if (
        questionSection === null ||
        questionSection?.parsedQuestions.length === 0
      ) {
        return next(
          new ErrorHandler(
            "Sections not found for this subject",
            HttpStatus.FORBIDDEN
          )
        );
      }
      const { name, section } = request.body;
      if (!name || (name as string).trim().length === 0)
        return next(
          new ErrorHandler("Report name missing", HttpStatus.FORBIDDEN)
        );
      const questionsMap = questionSection?.parsedQuestions;
      const studentsMarks = this.getStudentsMarks(request);
      const courseOutcome: CourseOutcomes =
        this.calculatorService.calculateCourseOutcomes(
          studentsMarks,
          questionsMap,
          examType
        );
      const attainment = this.parseCoPoSheet(request, courseOutcome);
      await this.calculatorService.initializeReport(
        name.toString(),
        subject,
        studentsMarks,
        courseOutcome,
        attainment,
        section,
        request.params.examTypeId
      );
      next(
        new ResponseHandler({
          attainment,
          courseOutcome,
          // parsedStudentData,
          studentsMarks,
        })
      );
    } catch (e) {
      next(new ErrorHandler(e));
    }
  };
  public generateCumulativeReport = async (
    request: CustomRequest<UserEntity>,
    response: CustomResponse<{ [RepositoryEntity.SUBJECT]: SubjectEntity }>,
    next: NextFunction
  ) => {
    const { reportIds, name } = request.body;
    const report = await this.calculatorService.generateCumulativeReport(
      response.locals.data[RepositoryEntity.SUBJECT],
      name,
      reportIds
    );
    if (typeof report === "string") return next(new ErrorHandler(report));
    next(new ResponseHandler(report));
  };

  private async getSections(
    request: CustomRequest<UserEntity>,
    subject: SubjectEntity,
    examType: ExamTypes
  ): Promise<{
    parsedQuestions: QuestionsMap[];
  } | null> {
    const parsedQuestions: QuestionsMap[] = [];
    if (!subject || !examType.sections) return null;
    examType.sections.forEach((s, index) => {
      s.questions.forEach((question) => {
        parsedQuestions.push({
          part: question.part,
          section: index + 1,
          co: question.co,
          maxMarks: question.maxMarks,
        });
      });
    });
    return { parsedQuestions };
  }

  private parseCoPoSheet(
    request: CustomRequest<any>,
    courseOutcomes: CourseOutcomes
  ) {
    const sheetData = this.utils.parseSheetToJson(
      request.files as Express.Multer.File[],
      "copo"
    );
    let co = "";
    const programOutcomes = {};
    sheetData.forEach((data: any) => {
      for (let key in data) {
        if (key.toUpperCase() === "CO/PO") {
          co = data[key];
        } else {
          const percentage =
            Number(data[key]) *
              courseOutcomes?.[co.toUpperCase()?.split("CO")?.[1]]
                ?.attainment || "0";
          programOutcomes[key] = {
            percentage:
              Number(percentage) +
              (programOutcomes[key] ? programOutcomes[key].percentage : 0),
            data:
              Number(data[key]) +
              (programOutcomes[key] ? programOutcomes[key].data : 0),
          };
        }
      }
    });
    for (let po in programOutcomes) {
      const { percentage, data } = programOutcomes[po];
      const poPercentage = (percentage / data / 3) * 100;
      programOutcomes[po] = poPercentage;
    }
    return programOutcomes;
  }
  private getStudentsMarks(request: CustomRequest<any>): SavedReportMarks[] {
    const sheetData = this.utils.parseSheetToJson(
      request.files as Express.Multer.File[],
      "marks"
    );
    const parsedMarks = [];
    for (let i = 5; i < sheetData.length; i++) {
      const val = Object.values(sheetData[i]);
      let name = "";
      let id = "";
      let currentMarks: any[] = [];
      const marksArray = val.filter(
        (_, index) =>
          (index > 3 && index < val.length - 1) || [1, 2].includes(index)
      );
      const marks = marksArray.map((value: any, index) => {
        if (index === 0) id = value.toString();
        else if (index === 1) name = value.toString();
        else currentMarks.push((isNaN(value) && "-") || Number(value));
      });
      if (marks.length > 0) {
        parsedMarks.push(new SavedReportMarks(name, id, currentMarks));
      }
    }
    return parsedMarks;
  }
  // private parseStudentData(
  //   studentsMarks: SavedReportMarks[],
  //   questionsMap: QuestionsMap[]
  // ): ParsedStudentData {
  //   let parsedStudentData: ParsedStudentData = {};
  //   studentsMarks.forEach((studentData) => {
  //     let newSumbObj: { section?: QuestionsMap } = {};
  //     let sumObj = [];
  //     let lastPart = questionsMap[0].part;
  //     let lastSection = questionsMap[0].section;
  //     const obj = {};
  //     let sum = 0;
  //     let j = 0;
  //     const student = studentData.marks;
  //     while (j <= questionsMap.length) {
  //       const save = () => {
  //         if (!obj[lastSection] || obj[lastSection] < sum) {
  //           obj[lastSection] = sum;
  //           newSumbObj[lastSection] = sumObj;
  //         }
  //         sum = 0;
  //         sumObj = [];
  //       };
  //       if (j == questionsMap.length) {
  //         save();
  //         break;
  //       }
  //       const { part, section, co, maxMarks } = questionsMap[j];
  //       if (part != lastPart) save();
  //       sum += isNaN(student[j]) ? 0 : student[j];
  //       sumObj.push({ co, maxMarks, mark: student[j] });
  //       lastPart = part;
  //       lastSection = section;
  //       j++;
  //     }
  //     //
  //     const filtered: any = Object.values(newSumbObj);
  //     (filtered || []).forEach(
  //       (student: { mark: number; maxMarks: number; co: number[] }[]) => {
  //         student.forEach(({ mark, maxMarks, co }, index) => {
  //           co.forEach((c) => {
  //             if (!parsedStudentData[c]) {
  //               parsedStudentData[c] = [{ mark, maxMarks, co: c }];
  //             } else {
  //               parsedStudentData[c].push({ mark, maxMarks, co: c });
  //             }
  //           });
  //         });
  //       }
  //     );
  //   });
  //   return parsedStudentData;
  // }
  // private calculateCourseOutcomes(
  //   parsedStudentData: ParsedStudentData,
  //   subject: SubjectEntity
  // ): CourseOutcomes {
  //   const courseOutcomes: CourseOutcomes = {};
  //   for (let key in parsedStudentData) {
  //     const attempted = parsedStudentData[key].filter(
  //       ({ mark }) => typeof mark === "number"
  //     );
  //     let sum = 0;
  //     attempted.forEach(({ mark, maxMarks }, index) => {
  //       let percent = Math.floor((mark / maxMarks) * 100);
  //       if (percent >= subject.attainment) sum++;
  //     });
  //     const percentage = (sum / attempted.length) * 100;
  //     courseOutcomes[key] = {
  //       improvementRequired: percentage < subject.attainment,
  //       percentage,
  //       attempted: attempted.length,
  //       passedTarget: sum,
  //       attainment: (percentage * 3) / 100,
  //     };
  //   }
  //   return courseOutcomes;
  // }

  public exportReportById = (
    request: CustomRequest<UserEntity>,
    response: CustomResponse<{
      [RepositoryEntity.SAVED_REPORT]: SavedReportEntity;
    }>,
    next: NextFunction
  ) => {
    const { courseOutcomes, programOutcomes, marks } =
      response.locals.data[RepositoryEntity.SAVED_REPORT];
    const excelBlob = this.calculatorService.getExcelReport(
      marks,
      courseOutcomes as any,
      programOutcomes
    );
    response.setHeader(
      "content-type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    response.send(Buffer.from(excelBlob, "binary"));
  };

  public getReports = (byId?: boolean) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: CustomResponse<{ [RepositoryEntity.SUBJECT]: SubjectEntity }>,
      next: NextFunction
    ) => {
      const { examTypeId } = request.params;
      next(
        new ResponseHandler(
          byId
            ? await this.savedReportRepository.get({
                where: {
                  _id: this.savedReportRepository.setId(
                    request.params.reportId
                  ),
                },
              })
            : await this.savedReportRepository.getAll({
                where: {
                  ...(!byId && examTypeId === "-" ? {} : { examTypeId }),
                  subjectId: this.savedReportRepository.setId(
                    response.locals.data[RepositoryEntity.SUBJECT]._id
                  ),
                },
              })
        )
      );
    };
  };
}
