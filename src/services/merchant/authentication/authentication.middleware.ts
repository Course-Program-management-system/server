import { Joi } from "celebrate";
import { CryptoService } from "common/services";
import { Controller } from "common/services/controller.service";
import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "interfaces";
import { UserEntity } from "repository/entity/User";
import RepositoryService, { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import ErrorHandler from "utils/error-handler.utils";
import BeanValidateMiddleware from "middlewares/body-validate.middleware";
import { CustomRequest } from "interfaces/payload.interface";
import AttainmentService from "../attainment.service";
@autoInjectable()
export default class AuthenticationMiddlewareService extends Controller {
  private userRepository = new RepositoryService<UserEntity>(UserEntity);
  constructor(
    private beanValidateMiddleware: BeanValidateMiddleware,
    private attainmentService: AttainmentService
  ) {
    super();
  }
  public readonly superAdminRegister = Joi.object({
    collegeName: Joi.string().required().min(1).max(20),
    email: Joi.string().required().email(),
  });
  public readonly adminRegister = Joi.object({
    email: Joi.string().required().email(),
  });
  public readonly login = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(5),
  });
  public readonly verifyAdmin = Joi.object({
    authData: Joi.string().required(),
    password: Joi.string().required().min(5),
  });
  public verifyChangePassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { verify } = request.query;
    const { email, authData, password } = request.body;
    if (verify) {
      if (!authData || !password || password?.trim().length < 5)
        return next(
          new ErrorHandler(
            "Invalid password or authData",
            HttpStatus.BAD_REQUEST
          )
        );
      return next();
    }
    if (
      !this.beanValidateMiddleware.validateSchema(this.adminRegister, { email })
    ) {
      return next(new ErrorHandler("Invalid email", HttpStatus.BAD_REQUEST));
    }
    next();
  };
  public verifyEmail = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { email } = request.body;
    if (
      await this.userRepository.get({
        where: { email }, //: this.cryptoService.gethash(email) },
      })
    ) {
      return next(
        new ErrorHandler(
          "Admin with this email already exists",
          HttpStatus.BAD_REQUEST
        )
      );
    }
    next();
  };

  public verifyAuthUser = async (
    request: CustomRequest<UserEntity>,
    response: Response,
    next: NextFunction
  ) => {
    const { type, typeId } = request.params;
    const entity =
      type === "department"
        ? RepositoryEntity.DEPARTMENT
        : type === "program"
        ? RepositoryEntity.PROGRAM
        : RepositoryEntity.SUBJECT;
    const responseData = await this.attainmentService.verifyEntityData(
      entity,
      request.data,
      typeId,
      true
    );
    if (!responseData) return next(new ErrorHandler(`${type} not found`));
    response.locals.data = {
      [type]: responseData,
    };
    next();
  };
}
