import Router from "common/services/common-router.service";
import { CustomRouter } from "interfaces";
import BeanValidateMiddleware from "middlewares/body-validate.middleware";
import { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import AttainmentMiddleware from "../attainment.middleware";
import ProfileController from "./profile.controller";
import ProfileMiddleware from "./profile.middleware";
@autoInjectable()
export default class ProfileRouter extends Router implements CustomRouter {
  constructor(
    private beanValidate: BeanValidateMiddleware,
    private controller: ProfileController,
    private middleware: ProfileMiddleware
  ) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.put(
      "",
      this.beanValidate.validate(this.middleware.updateSchema),
      this.controller.update
    );
  }
  public getRouter() {
    return this.serviceApp;
  }
}
