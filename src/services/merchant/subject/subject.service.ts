import { HttpStatus } from "interfaces";
import { ServiceResponse } from "interfaces/payload.interface";
import { ObjectId } from "mongodb";
import { SubjectEntity } from "repository/entity/subject-entity";
import ExamTypes from "repository/entity/subject-entity/ExamTypes.entity";
import SectionQuestion from "repository/entity/subject-entity/SectionQuestion";
import RepositoryService from "repository/services";

export default class SubjectService {
  private readonly repository = new RepositoryService<SubjectEntity>(
    SubjectEntity
  );

  createExamType = (
    subject: SubjectEntity,
    body: any
  ): Promise<ServiceResponse<ExamTypes>> => {
    return new Promise(async (resolve) => {
      subject.examTypes = (!subject.examTypes && []) || subject.examTypes;
      const examTypeBean = this.repository.getEntityObject(
        body,
        ExamTypes
      ) as ExamTypes;
      if (
        examTypeBean.sections &&
        !this.hasValidQuestionparts(examTypeBean.sections)
      )
        return resolve({
          error: "Invalid sections found",
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      examTypeBean._id = new ObjectId();
      await this.repository.getManager().updateOne(
        this.repository.getEntity(),
        { _id: this.repository.setId(subject._id) },
        {
          $addToSet: {
            examTypes: examTypeBean,
          },
        }
      );
      resolve({ data: examTypeBean });
    });
  };

  deleteExamType = (
    subject: SubjectEntity,
    examType: ExamTypes
  ): Promise<ServiceResponse<ExamTypes> | void> => {
    return new Promise(async (resolve) => {
      await this.repository.getManager().updateOne(
        this.repository.getEntity(),
        { _id: this.repository.setId(subject._id) },
        {
          $pull: {
            examTypes: {
              _id: this.repository.setId(examType._id),
            },
          },
        }
      );
      resolve();
    });
  };

  updateExamType = (
    subject: SubjectEntity,
    body: any,
    examType: ExamTypes
  ): Promise<ServiceResponse<ExamTypes>> => {
    return new Promise(async (resolve) => {
      const examTypeBean = {
        ...this.repository.getEntityObject(body, ExamTypes),
        _id: examType._id,
      } as ExamTypes;
      if (
        examTypeBean.sections &&
        !this.hasValidQuestionparts(examTypeBean.sections)
      )
        return resolve({
          error: "Invalid sections found",
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      const index = subject.examTypes.findIndex(
        (v) => `${v?._id}` === `${examType._id}`
      );
      await this.repository.getManager().updateOne(
        this.repository.getEntity(),
        {
          _id: this.repository.setId(subject._id),
        },
        {
          $set: {
            [`examTypes.${index}`]: examTypeBean,
          },
        }
      );
      resolve({ data: examTypeBean });
    });
  };

  private hasValidQuestionparts(
    section: { questions: SectionQuestion[] }[]
  ): boolean {
    for (const s of section) {
      for (let i = 1; i < s.questions.length; i++) {
        if (s.questions[i].part < s.questions[i - 1].part) return false;
      }
    }
    return true;
  }
}
