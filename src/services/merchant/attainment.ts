import Router from "common/services/common-router.service";
import express from "express";
import { PermissionRoleType } from "interfaces/entities.interface";
import AuthMiddleware from "middlewares/auth.middleware";
import BeanValidateMiddleware from "middlewares/body-validate.middleware";
import { RepositoryEntity } from "repository/services";
import { autoInjectable, container } from "tsyringe";
import AttainmentMiddleware from "./attainment.middleware";
import AttainmentService from "./attainment.service";
import AuthenticationRouter from "./authentication/authentication";
import CalculatorRouter from "./calculator/calculator";
import DepartmentRouter from "./department/department";
import ProfileRouter from "./profile/profile";
import ProgramRouter from "./program/program";
import SubjectRouter from "./subject";
@autoInjectable()
export default class Merchant extends Router {
  private readonly verifyOwnerActionMiddleware =
    this.attainmentMiddleware.verifyOwnerEntityAction(
      "typeId",
      null,
      (request) => request.params.type as RepositoryEntity
    );
  private readonly defaultAttainmentMiddlewares = [
    this.authMiddleware.validateToken,
    this.authMiddleware.validatePermissionOnDemand(
      this.attainmentService.verifyPermissions
    ),
  ];
  constructor(
    private authMiddleware: AuthMiddleware,
    private attainmentService: AttainmentService,
    private attainmentMiddleware: AttainmentMiddleware,
    private beanValidateMiddleware: BeanValidateMiddleware
  ) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.use(container.resolve(AuthenticationRouter).getRouter());
    this.serviceApp.use(
      this.authMiddleware.validateToken,
      container.resolve(CalculatorRouter).getRouter()
    );
    this.serviceApp.use(
      this.authMiddleware.validateToken,
      container.resolve(ProgramRouter).getRouter()
    );
    this.serviceApp.use(
      this.authMiddleware.validateToken,
      container.resolve(SubjectRouter).getRouter()
    );
    this.serviceApp.use(
      "/profile",
      this.authMiddleware.validateToken,
      this.authMiddleware.verifyAdminPermission([
        PermissionRoleType.UNIVERSITY,
        PermissionRoleType.DIRECTOR,
        PermissionRoleType.TEACHER,
      ]),
      container.resolve(ProfileRouter).getRouter()
    );
    this.serviceApp.use(
      "/department",
      this.authMiddleware.validateToken,
      this.authMiddleware.verifyAdminPermission([
        PermissionRoleType.UNIVERSITY,
        PermissionRoleType.DIRECTOR,
      ]),
      container.resolve(DepartmentRouter).getRouter()
    );

    this.serviceApp.get(
      "^/:type(department|program|subject)",
      ...this.defaultAttainmentMiddlewares,
      this.attainmentMiddleware.getAll(
        RepositoryEntity.DEPARTMENT,
        true,
        () => {},
        (request) => request.params.type as RepositoryEntity
      )
    );
    this.serviceApp.delete(
      "^/:type(program|department|subject)/:typeId",
      ...this.defaultAttainmentMiddlewares,
      this.attainmentMiddleware.verifyEntityData(
        RepositoryEntity.PROGRAM,
        true,
        true,
        (request) => request.params.type as RepositoryEntity,
        "typeId"
      ),
      this.verifyOwnerActionMiddleware,
      this.attainmentMiddleware.delete(
        RepositoryEntity.PROGRAM,
        (request) => request.params.type as RepositoryEntity,
        "typeId"
      )
    );

    this.serviceApp.get(
      "^/:type(program|department|subject)/:typeId",
      ...this.defaultAttainmentMiddlewares,
      this.attainmentMiddleware.getById(
        RepositoryEntity.PROGRAM,
        true,
        (request) => request.params.type as RepositoryEntity,
        "typeId"
      )
    );
    this.serviceApp.put(
      "^/:type(program|department|subject)/:typeId",
      ...this.defaultAttainmentMiddlewares,
      this.beanValidateMiddleware.validate(
        {} as any,
        {},
        this.attainmentService.getPutValidators
      ),
      this.attainmentMiddleware.verifyUniqueBean(
        RepositoryEntity.PROGRAM,
        "name",
        true,
        (request) => request.params.type as RepositoryEntity,
        "typeId"
      ),
      this.verifyOwnerActionMiddleware,
      this.attainmentMiddleware.updateBean(
        RepositoryEntity.PROGRAM,
        (request) => request.params.type as RepositoryEntity,
        "typeId"
      )
    );
  }
  public getRouter() {
    return express().use("/attainment", this.serviceApp);
  }
}
