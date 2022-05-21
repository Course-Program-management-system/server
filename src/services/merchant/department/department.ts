import Router from "common/services/common-router.service";
import { CustomRouter, PermissionTypes } from "interfaces";
import BeanValidateMiddleware from "middlewares/body-validate.middleware";
import DepartmentEntity from "repository/entity/Department.entity";
import { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import AttainmentMiddleware from "../attainment.middleware";
import AuthenticationController from "../authentication/authentication.controller";
import AuthenticationMiddlewareService from "../authentication/authentication.middleware";
import DepartmentMiddleware from "./department.middleware";
@autoInjectable()
export default class DepartmentRouter extends Router implements CustomRouter {
  constructor(
    private departmentMiddleware: DepartmentMiddleware,
    private beanValidate: BeanValidateMiddleware,
    private attainmentMiddleware: AttainmentMiddleware,
    private authenticationMiddleware: AuthenticationMiddlewareService,
    private authenticationController: AuthenticationController
  ) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.post(
      "",
      this.beanValidate.validate(this.departmentMiddleware.createSchema),
      this.attainmentMiddleware.verifyUniqueBean(
        RepositoryEntity.DEPARTMENT,
        "name"
      ),
      this.attainmentMiddleware.create<DepartmentEntity>(
        RepositoryEntity.DEPARTMENT,
        (entity, request) => {
          const { _id } = request.data;
          entity.permission = {
            [_id]: [
              PermissionTypes.READ,
              PermissionTypes.DELETE,
              PermissionTypes.UPDATE,
            ],
          };
        }
      )
    );
  }
  public getRouter() {
    return this.serviceApp;
  }
}
