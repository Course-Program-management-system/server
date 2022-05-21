import { ObjectID } from "mongodb";
import {
  SavedReportCourseOutcomes,
  SavedReportEntity,
  SavedReportMarks,
  SavedReportProgramOutcomes,
} from "repository/entity/saved-report.entity";
import { SubjectEntity } from "repository/entity/subject-entity";
import ExamTypes from "repository/entity/subject-entity/ExamTypes.entity";
import RepositoryService, { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import XLSX from "xlsx";
import { CourseOutcomes, QuestionsMap } from "./calculator.controller";
@autoInjectable()
export default class CalculatorService {
  private reportRepostory = RepositoryService.getRepository(
    RepositoryEntity.SAVED_REPORT
  );
  public getExcelReport(
    savedReportMarks: SavedReportMarks[],
    CourseOutcomes: CourseOutcomes[],
    programOutcomes: any[]
  ): any {
    for (let i = 0; i < savedReportMarks.length; i++) {
      const marksObj = {};
      savedReportMarks[i].marks.forEach((mark, index) => {
        marksObj[`Q${index}`] = mark;
      });
      delete savedReportMarks[i].marks;
      savedReportMarks[i] = { ...savedReportMarks[i], ...marksObj };
    }
    const workbook = XLSX.utils.book_new();
    const saveReportSheet = XLSX.utils.json_to_sheet(savedReportMarks);
    const courseOutcomesSheet = XLSX.utils.json_to_sheet(CourseOutcomes);
    const programOutcomesSheet = XLSX.utils.json_to_sheet(programOutcomes);
    XLSX.utils.book_append_sheet(workbook, saveReportSheet, "Marks");
    XLSX.utils.book_append_sheet(
      workbook,
      courseOutcomesSheet,
      "Course Outcomes"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      programOutcomesSheet,
      "Program Outcomes"
    );
    return XLSX.write(workbook, {
      bookType: "xlsx",
      bookSST: false,
      type: "array",
    });
  }

  public calculateCumulativeReport(reports: SavedReportEntity[]): {
    programOutcomes: any;
    courseOutcomes: SavedReportCourseOutcomes[];
  } {
    const programOutcomes = {};
    const averageProgramOutcomes: { name: string; attainment: number }[] = [];
    const courseOutcomes = {};
    const averageCourseOutcomes: SavedReportCourseOutcomes[] = [];
    const average = (arr) => arr.reduce((a, c) => a + c, 0) / arr.length;
    reports.forEach((report) => {
      //program
      report.programOutcomes.forEach((programOutcome) => {
        const { attainment, name } = programOutcome;
        if (programOutcomes[name]) {
          programOutcomes[name].push(attainment);
        } else {
          programOutcomes[name] = [attainment];
        }
      });
      //outcome
      report.courseOutcomes.forEach((courseOutcome) => {
        const { attainment, name, percentage, passedTarget } = courseOutcome;
        if (!courseOutcomes[name]) {
          courseOutcomes[name] = {
            attainment: [attainment],
            percentage: [percentage],
            passedTarget: [passedTarget],
          };
        } else {
          courseOutcomes[name]["attainment"].push(attainment);
          courseOutcomes[name]["percentage"].push(percentage);
          courseOutcomes[name]["passedTarget"].push(passedTarget);
        }
      });
    });
    for (let outcome in programOutcomes) {
      programOutcomes[outcome] = average(programOutcomes[outcome]);
      averageProgramOutcomes.push({
        name: outcome,
        attainment: programOutcomes[outcome],
      });
    }

    for (let outcome in courseOutcomes) {
      courseOutcomes[outcome].attainment = average(
        courseOutcomes[outcome].attainment
      );
      courseOutcomes[outcome]["percentage"] = average(
        courseOutcomes[outcome]["percentage"]
      );
      courseOutcomes[outcome]["passedTarget"] = average(
        courseOutcomes[outcome]["passedTarget"]
      );
      courseOutcomes[outcome]["name"] = outcome;
      courseOutcomes[outcome]["improvementRequired"] =
        courseOutcomes[outcome].percentage < courseOutcomes[outcome].attainment;
      averageCourseOutcomes.push(courseOutcomes[outcome]);
    }
    return {
      programOutcomes: averageProgramOutcomes,
      courseOutcomes: averageCourseOutcomes,
    };
  }

  public calculateCourseOutcomes(
    savedReportMarks: SavedReportMarks[],
    questionsMap: QuestionsMap[],
    examType: ExamTypes
  ): CourseOutcomes {
    const onlyMarks: number[][] = savedReportMarks.map((v) => v.marks);
    // const indexes = [];
    // const filterIndexes = (i, tempSum) => {
    //   let s = -Infinity;
    //   let newIndexes = [];
    //   for (let i in tempSum) {
    //     if (tempSum[i].sum > s) {
    //       s = tempSum[i].sum;
    //       newIndexes = tempSum[i].indexes;
    //     }
    //   }
    //   !indexes[i] && indexes.push([]);
    //   indexes[i] = indexes[i].concat(newIndexes);
    // };
    // onlyMarks.forEach((marks, marksIndex) => {
    //   let tempSum = {};
    //   let tempPart = questionsMap[0].part;
    //   let tempSection = questionsMap[0].section;
    //   for (let i = 0; i <= questionsMap.length; i++) {
    //     const { part, section, co } = questionsMap[i] || {};
    //     if (!section || tempSection != section) {
    //       filterIndexes(marksIndex, tempSum);
    //       if (i === questionsMap.length) continue;
    //       tempSum = {};
    //     }
    //     const idx = `${part}-${section}`;
    //     if (!tempSum[idx]) {
    //       tempSum[idx] = {
    //         sum: isNaN(marks[i]) ? 0 : Number(marks[i]),
    //         indexes: [i],
    //       };
    //     } else {
    //       tempSum[idx].sum += isNaN(marks[i]) ? 0 : Number(marks[i]);
    //       tempSum[idx].indexes.push(i);
    //     }
    //     tempSection = section;
    //     tempPart = part;
    //   }
    // });
    const transposedMarks = onlyMarks[0].map((_, colIndex) =>
      onlyMarks.map((row) => row[colIndex])
    );
    const coData: CourseOutcomes = {};
    transposedMarks.forEach((colMarks, colIdx) => {
      const { maxMarks, co } = questionsMap[colIdx];
      let attempted = 0;
      let passed = 0;
      colMarks.forEach((mark, index) => {
        const valid = !isNaN(mark);
        // const valid = indexes[index].includes(colIdx) && !isNaN(mark);
        attempted += (valid && 1) || 0;
        passed +=
          (valid &&
            (Number(mark) / Number(maxMarks)) * 100 >= examType.target &&
            1) ||
          0;
      });
      if (attempted) {
        let a = (passed / attempted) * 100;
        a = isNaN(a) ? 0 : a;
        (co as number[]).forEach((courseOutcome) => {
          if (coData[courseOutcome]) {
            const { passedTarget, percentage } = coData[Number(courseOutcome)];
            coData[Number(courseOutcome)] = {
              ...coData[Number(courseOutcome)],
              percentage: (percentage + a) / 2,
              passedTarget: passed + passedTarget,
              attempted: attempted + coData[Number(courseOutcome)].attempted,
            };
            coData[Number(courseOutcome)].questionMarks?.push(a);
          } else {
            coData[Number(courseOutcome)] = {
              percentage: a,
              passedTarget: passed,
              attempted: attempted,
              attainment: 0,
              improvementRequired: false,
              questionMarks: [a],
            };
          }
        });
      }
    });
    for (let course in coData) {
      const total = coData[course].questionMarks.reduce((a, c) => a + c, 0);
      coData[course].percentage = total / coData[course].questionMarks.length;
      coData[course].attainment = (coData[course].percentage * 3) / 100;
      coData[course].improvementRequired =
        coData[course].percentage < examType.target;
    }
    return coData;
  }

  public generateCumulativeReport = async (
    subject: SubjectEntity,
    name: string,
    reportIds: string[]
  ): Promise<SavedReportEntity | string> => {
    const reports = await this.reportRepostory.getAll({
      where: {
        _id: { $in: reportIds.map((v) => new ObjectID(v)) },
      },
    });
    const { courseOutcomes, programOutcomes } = this.calculateCumulativeReport(
      reports as SavedReportEntity[]
    );
    const repo = new RepositoryService<SavedReportEntity>(SavedReportEntity);
    return await repo.create(
      new SavedReportEntity().setBean(
        name,
        subject._id,
        courseOutcomes,
        programOutcomes,
        []
      )
    );
  };

  public initializeReport = async (
    name: string,
    subject: SubjectEntity,
    studentsMarks: SavedReportMarks[],
    courseOutcomes: CourseOutcomes,
    programOutcomes: any,
    section: string | null,
    examTypeId: any
  ): Promise<SavedReportEntity> => {
    const savedReportCourseOutcomes: SavedReportCourseOutcomes[] = [];
    for (let c in courseOutcomes) {
      const {
        attainment,
        improvementRequired,
        percentage,
        passedTarget,
        attempted,
      } = courseOutcomes[c];
      savedReportCourseOutcomes.push(
        new SavedReportCourseOutcomes(
          c,
          attempted,
          attainment,
          passedTarget,
          improvementRequired,
          percentage
        )
      );
    }
    const savedReportProgramOutcomes: SavedReportProgramOutcomes[] = [];
    for (let c in programOutcomes) {
      savedReportProgramOutcomes.push(
        new SavedReportProgramOutcomes(c, programOutcomes[c])
      );
    }
    const repo = new RepositoryService<SavedReportEntity>(SavedReportEntity);
    return await repo.create(
      new SavedReportEntity().setBean(
        name,
        subject._id,
        savedReportCourseOutcomes,
        savedReportProgramOutcomes,
        studentsMarks,
        examTypeId,
        section
      )
    );
  };
}
