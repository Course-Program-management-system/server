import Router from "common/services/common-router.service";
import { CustomRouter } from "interfaces";
import { PermissionRoleType } from "interfaces/entities.interface";
import AuthMiddleware from "middlewares/auth.middleware";
import BeanValidateMiddleware from "middlewares/body-validate.middleware";
import multer from "multer";
import { RepositoryEntity } from "repository/services";
import AttainmentMiddleware from "services/merchant/attainment.middleware";
import { autoInjectable } from "tsyringe";
import SubjectMiddleware from "../subject/subject.middleware";
import CalculatorController from "./calculator.controller";
import CalculatorMiddleware from "./calculator.middleware";
@autoInjectable()
export default class CalculatorRouter extends Router implements CustomRouter {
  constructor(
    private controller: CalculatorController,
    private attainmentMiddleware: AttainmentMiddleware,
    private authMiddleware: AuthMiddleware,
    private beanValidate: BeanValidateMiddleware,
    private middleware: CalculatorMiddleware,
    private subjectMiddleware: SubjectMiddleware
  ) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.get(
      "/subject/:subjectId/:examTypeId/report",
      this.authMiddleware.verifyAdminPermission(PermissionRoleType.TEACHER),
      this.attainmentMiddleware.verifyEntityData(
        RepositoryEntity.SUBJECT,
        true,
        true
      ),
      // this.subjectMiddleware.verifyExamType,
      this.controller.getReports()
    );
    this.serviceApp.post(
      "/subject/:subjectId/:examTypeId/calculate",
      this.authMiddleware.verifyAdminPermission(PermissionRoleType.TEACHER),
      this.attainmentMiddleware.verifyEntityData(
        RepositoryEntity.SUBJECT,
        true,
        true
      ),
      this.subjectMiddleware.verifyExamType,
      multer({ storage: multer.memoryStorage() }).any(),
      this.controller.generateAttainmentReport
    );

    this.serviceApp.post(
      "/subject/:subjectId/generate-cumulative",
      this.authMiddleware.verifyAdminPermission(PermissionRoleType.TEACHER),
      this.attainmentMiddleware.verifyEntityData(
        RepositoryEntity.SUBJECT,
        true,
        true
      ),
      this.beanValidate.validate(this.middleware.generateCummulativeSchema),
      this.controller.generateCumulativeReport
    );
    this.serviceApp.get(
      "/report/:reportId",
      this.authMiddleware.verifyAdminPermission(PermissionRoleType.TEACHER),
      this.controller.getReports(true)
    );

    this.serviceApp.get(
      "/exportreport/:reportId",
      this.attainmentMiddleware.verifyEntityData(
        RepositoryEntity.SAVED_REPORT,
        false,
        true
      ),
      this.controller.exportReportById
    );
    this.serviceApp.delete(
      "/report/:reportId",
      this.authMiddleware.verifyAdminPermission(PermissionRoleType.TEACHER),
      this.attainmentMiddleware.delete(RepositoryEntity.SAVED_REPORT)
    );
  }
  public getRouter() {
    return this.serviceApp;
  }
}
