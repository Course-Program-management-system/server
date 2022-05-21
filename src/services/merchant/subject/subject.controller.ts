import { Controller } from "common/services";
import { NextFunction } from "express";
import { HttpStatus } from "interfaces";
import { CustomRequest, CustomResponse } from "interfaces/payload.interface";
import { SubjectEntity } from "repository/entity/subject-entity";
import { UserEntity } from "repository/entity/User";
import { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import SubjectService from "./subject.service";
@autoInjectable()
export default class SubjectController extends Controller {
  constructor(private subjectService: SubjectService) {
    super();
  }

  createExamType = async (
    request: CustomRequest<UserEntity>,
    response: CustomResponse<{ [RepositoryEntity.SUBJECT]: SubjectEntity }>,
    next: NextFunction
  ) => {
    const { data, httpStatus, error } =
      await this.subjectService.createExamType(
        response.locals.data[RepositoryEntity.SUBJECT],
        request.body
      );
    this.send(next, !error, error || data, httpStatus || HttpStatus.SUCCESS);
  };

  removeExamType = async (
    request: CustomRequest<UserEntity>,
    response: CustomResponse<{ [RepositoryEntity.SUBJECT]: SubjectEntity }>,
    next: NextFunction
  ) => {
    await this.subjectService.deleteExamType(
      response.locals.data[RepositoryEntity.SUBJECT],
      request["examType"]
    );
    this.send(next, true, null, HttpStatus.NO_CONTENT);
  };

  updateExamType = async (
    request: CustomRequest<UserEntity>,
    response: CustomResponse<{ [RepositoryEntity.SUBJECT]: SubjectEntity }>,
    next: NextFunction
  ) => {
    const { data, httpStatus, error } =
      await this.subjectService.updateExamType(
        response.locals.data[RepositoryEntity.SUBJECT],
        request.body,
        request["examType"]
      );
    this.send(next, !error, error || data, httpStatus || HttpStatus.SUCCESS);
  };

  getExamType = async (
    request: CustomRequest<UserEntity>,
    response: CustomResponse<{ [RepositoryEntity.SUBJECT]: SubjectEntity }>,
    next: NextFunction
  ) => {
    const { examTypeId } = request.params;
    const subject = response.locals.data[RepositoryEntity.SUBJECT];
    if (examTypeId && !request["examType"])
      return this.send(
        next,
        false,
        "Exam type not found",
        HttpStatus.NOT_FOUND
      );
    this.send(
      next,
      true,
      !examTypeId ? { items: subject?.examTypes || [] } : request["examType"]
    );
  };
}
