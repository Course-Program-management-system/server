import { Joi } from "celebrate";
import { Controller } from "common/services";
import { autoInjectable } from "tsyringe";
import { NextFunction } from "express";
import { HttpStatus } from "interfaces";
import { CustomRequest, CustomResponse } from "interfaces/payload.interface";
import { SubjectEntity } from "repository/entity/subject-entity";
import { UserEntity } from "repository/entity/User";
import { RepositoryEntity } from "repository/services";
@autoInjectable()
export default class SubjectMiddleware extends Controller {
  private readonly sectionsSchema = Joi.array()
    .min(1)
    .items({
      questions: Joi.array()
        .required()
        .min(1)
        .items({
          part: Joi.string().min(1).required(),
          co: Joi.array().required().unique().items(Joi.number()),
          maxMarks: Joi.number().min(1).required(),
        }),
    });
  public readonly schema = Joi.object({
    name: Joi.string().required().min(1).max(20),
    code: Joi.number().min(1),
    // attainment: Joi.number().required(),
    // sections: this.sectionsSchema,
    // examType: Joi.string().min(1),
    // semester: Joi.number().min(1),
  });

  public readonly schemaUpdate = Joi.object({
    name: Joi.string().min(1).max(20),
    code: Joi.number().min(1),
    // attainment: Joi.number().min(1),
    // sections: this.sectionsSchema,
    // examType: Joi.string().min(1),
    // semester: Joi.number().min(1),
  });

  public readonly examTypeSchema = Joi.object({
    name: Joi.string().required().max(10),
    target: Joi.number(),
    sections: this.sectionsSchema,
  });

  public readonly examTypeSchemaUpdate = Joi.object({
    name: Joi.string().max(10),
    target: Joi.number(),
    sections: this.sectionsSchema,
  });

  verifyExamType = async (
    request: CustomRequest<UserEntity>,
    response: CustomResponse<{ [RepositoryEntity.SUBJECT]: SubjectEntity }>,
    next: NextFunction
  ) => {
    const { examTypeId } = request.params;
    const examType = response.locals.data[
      RepositoryEntity.SUBJECT
    ].examTypes?.find((v) => v._id?.toString() === examTypeId.toString());
    if (!examType)
      return this.send(
        next,
        false,
        "Exam type not found",
        HttpStatus.NOT_FOUND
      );
    request["examType"] = examType;
    next();
  };
}
