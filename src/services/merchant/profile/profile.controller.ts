import { Controller } from "common/services";
import { NextFunction, Response } from "express";
import { CustomRequest } from "interfaces/payload.interface";
import { SubjectEntity } from "repository/entity/subject-entity";
import { UserEntity } from "repository/entity/User";
import RepositoryService from "repository/services";
import { autoInjectable } from "tsyringe";
import ProfileService from "./profile.service";
@autoInjectable()
export default class ProfileController extends Controller {
  constructor(private service: ProfileService) {
    super();
  }
  update = async (
    request: CustomRequest<UserEntity>,
    response: Response,
    next: NextFunction
  ) => {
    this.send(
      next,
      true,
      await this.service.updateProfile(request.data, request.body)
    );
  };
}
