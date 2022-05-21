import Router from "common/services/common-router.service";
import { CustomRouter, PermissionTypes } from "interfaces";
import { PermissionRoleType } from "interfaces/entities.interface";
import AuthMiddleware from "middlewares/auth.middleware";
import BeanValidateMiddleware from "middlewares/body-validate.middleware";
import { SubjectEntity } from "repository/entity/subject-entity";
import { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import AttainmentMiddleware from "../attainment.middleware";
import SubjectController from "./subject.controller";
import middleware from "./subject.middleware";
@autoInjectable()
export default class SubjectRouter extends Router implements CustomRouter {
  private readonly permissionMiddleware =
    this.authMiddleware.verifyAdminPermission(PermissionRoleType.TEACHER);
  private readonly verifySubjectBeanMiddleware =
    this.attainmentMiddleware.verifyEntityData(
      RepositoryEntity.SUBJECT,
      true,
      true
    );
  constructor(
    private controller: SubjectController,
    private beanValidate: BeanValidateMiddleware,
    private attainmentMiddleware: AttainmentMiddleware,
    private authMiddleware: AuthMiddleware,
    private middleware: middleware
  ) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.get(
      "/program/:programId/subject",
      this.permissionMiddleware,
      this.attainmentMiddleware.getAll<SubjectEntity>(
        RepositoryEntity.SUBJECT,
        true,
        (request, options) => {
          options["where"]["programId"] = request.params["programId"];
        }
      )
    );
    this.serviceApp.post(
      "/program/:programId/subject",
      this.permissionMiddleware,
      this.attainmentMiddleware.verifyEntityData(
        RepositoryEntity.PROGRAM,
        true,
        true
      ),
      this.beanValidate.validate(this.middleware.schema),
      this.attainmentMiddleware.verifyUniqueBean(
        RepositoryEntity.SUBJECT,
        "name"
      ),
      this.attainmentMiddleware.create(
        RepositoryEntity.SUBJECT,
        (entity: SubjectEntity, request) => {
          const { _id } = request.data;
          entity.permission = {
            [_id]: [
              PermissionTypes.READ,
              PermissionTypes.DELETE,
              PermissionTypes.UPDATE,
            ],
          };
          entity.programId = request.params.programId;
        }
      )
    );
    //exam type routes
    const examTypeMiddleware = [
      this.permissionMiddleware,
      this.verifySubjectBeanMiddleware,
    ];
    this.serviceApp.post(
      "/subject/:subjectId/examtype",
      ...examTypeMiddleware,
      this.beanValidate.validate(this.middleware.examTypeSchema),
      this.controller.createExamType
    );
    this.serviceApp.put(
      "/subject/:subjectId/examtype/:examTypeId",
      ...examTypeMiddleware,
      this.middleware.verifyExamType,
      this.beanValidate.validate(this.middleware.examTypeSchemaUpdate),
      this.controller.updateExamType
    );
    this.serviceApp.delete(
      "/subject/:subjectId/examtype/:examTypeId",
      ...examTypeMiddleware,
      this.middleware.verifyExamType,
      this.controller.removeExamType
    );

    this.serviceApp.get(
      "/subject/:subjectId/examtype/:examTypeId",
      ...examTypeMiddleware,
      this.middleware.verifyExamType,
      this.controller.getExamType
    );

    this.serviceApp.get(
      "/subject/:subjectId/examtype",
      ...examTypeMiddleware,
      this.controller.getExamType
    );
  }
  public getRouter() {
    return this.serviceApp;
  }
}
