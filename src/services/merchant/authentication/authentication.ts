import Router from "common/services/common-router.service";
import { NextFunction, request } from "express";
import { CustomRouter } from "interfaces";
import { PermissionRoleType } from "interfaces/entities.interface";
import { CustomRequest } from "interfaces/payload.interface";
import AuthMiddleware from "middlewares/auth.middleware";
import BeanValidateMiddleware from "middlewares/body-validate.middleware";
import { ObjectId } from "mongodb";
import multer from "multer";
import { UserEntity } from "repository/entity/User";
import { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import ResponseHandler from "utils/response-handler.util";
import AttainmentMiddleware from "../attainment.middleware";
import AuthenticationController from "./authentication.controller";
import AuthenticationMiddlewareService from "./authentication.middleware";
@autoInjectable()
export default class AuthenticationRouter
  extends Router
  implements CustomRouter
{
  constructor(
    private middleware: AuthenticationMiddlewareService,
    private controller: AuthenticationController,
    private authMiddleware: AuthMiddleware,
    private beanValidate: BeanValidateMiddleware,
    private attainmentMiddleware: AttainmentMiddleware
  ) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.post(
      "/superadmin",
      this.beanValidate.validate(this.middleware.superAdminRegister),
      this.middleware.verifyEmail,
      this.controller.registerSuperAdmin
    );
    this.serviceApp.post(
      "/verifysuperadmin",
      this.beanValidate.validate(this.middleware.verifyAdmin),
      this.middleware.verifyEmail,
      this.controller.verifySuperAdmin
    );
    this.serviceApp.post(
      "/login",
      this.beanValidate.validate(this.middleware.login),
      this.controller.login
    );
    this.serviceApp.post(
      "/verifyadmin",
      this.beanValidate.validate(this.middleware.verifyAdmin),
      this.controller.verifyAdmin
    );
    this.serviceApp.post(
      "/changepassword",
      this.middleware.verifyChangePassword,
      this.controller.changePassword
    );
    this.serviceApp.get(
      "/admin/profile",
      this.authMiddleware.validateToken,
      (req: CustomRequest<UserEntity>, _, next: NextFunction) =>
        next(new ResponseHandler(req.data))
    );

    this.serviceApp.post(
      "/:type(program|department|subject)/:typeId/user",
      this.authMiddleware.validateToken,
      this.authMiddleware.verifyAdminPermission([
        PermissionRoleType.UNIVERSITY,
        PermissionRoleType.DIRECTOR,
        PermissionRoleType.TEACHER,
      ]),
      this.middleware.verifyAuthUser,
      multer({ storage: multer.memoryStorage() }).any(),
      this.beanValidate.validate(
        this.middleware.adminRegister,
        {},
        (request) => (request.files && true) || false
      ),
      this.controller.registerAdmin
    );
    this.serviceApp.get(
      "/:type(program|department|subject)/:typeId/user",
      this.authMiddleware.validateToken,
      this.authMiddleware.verifyAdminPermission([
        PermissionRoleType.UNIVERSITY,
        PermissionRoleType.DIRECTOR,
        PermissionRoleType.TEACHER,
      ]),
      this.middleware.verifyAuthUser,
      this.attainmentMiddleware.getAll(
        RepositoryEntity.USER,
        false,
        (request, options, response) => {
          options["where"] = {
            _id: {
              $in: Object.keys(
                response.locals.data[request.params.type].permission
              ).map(ObjectId),
              $ne: request.data._id,
            },
          };
        }
      )
    );
    this.serviceApp.delete(
      "/:type(program|subject|department)/:typeId/user/:userId",
      this.authMiddleware.validateToken,
      this.authMiddleware.verifyAdminPermission([
        PermissionRoleType.UNIVERSITY,
        PermissionRoleType.DIRECTOR,
        PermissionRoleType.TEACHER,
      ]),
      this.middleware.verifyAuthUser,
      this.controller.deleteUserById
    );
  }
  public getRouter() {
    return this.serviceApp;
  }
}
