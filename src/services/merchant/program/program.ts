import Router from "common/services/common-router.service";
import { CustomRouter, PermissionTypes } from "interfaces";
import { PermissionRoleType } from "interfaces/entities.interface";
import AuthMiddleware from "middlewares/auth.middleware";
import BeanValidateMiddleware from "middlewares/body-validate.middleware";
import ProgramEntity from "repository/entity/Program.entity";
import { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import AttainmentMiddleware from "../attainment.middleware";
import ProgramMiddleware from "./program.middleware";
@autoInjectable()
export default class ProgramRouter extends Router implements CustomRouter {
  constructor(
    private authMiddleware: AuthMiddleware,
    private programMiddleware: ProgramMiddleware,
    private beanValidateMiddleware: BeanValidateMiddleware,
    private attainmentMiddleware: AttainmentMiddleware
  ) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.post(
      "/department/:departmentId/program",
      this.authMiddleware.verifyAdminPermission(PermissionRoleType.DIRECTOR),
      this.attainmentMiddleware.verifyEntityData(
        RepositoryEntity.DEPARTMENT,
        true
      ),
      this.beanValidateMiddleware.validate(this.programMiddleware.createSchema),
      this.attainmentMiddleware.verifyUniqueBean(
        RepositoryEntity.PROGRAM,
        "name"
      ),
      this.attainmentMiddleware.create<ProgramEntity>(
        RepositoryEntity.PROGRAM,
        (entity, request) => {
          entity.departmentId = request.params.departmentId;
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
    this.serviceApp.get(
      "/department/:departmentId/program",
      this.authMiddleware.verifyAdminPermission(PermissionRoleType.DIRECTOR),
      this.attainmentMiddleware.getAll<ProgramEntity>(
        RepositoryEntity.PROGRAM,
        true,
        (request, options) => {
          options["where"]["departmentId"] = request.params["departmentId"];
        }
      )
    );
  }
  public getRouter() {
    return this.serviceApp;
  }
}
