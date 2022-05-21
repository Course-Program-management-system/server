import { NextFunction, Response } from "express";
import { HttpStatus } from "interfaces";
import { PermissionRoleType } from "interfaces/entities.interface";
import { CustomRequest } from "interfaces/payload.interface";
import { UserEntity } from "repository/entity/User";
import RepositoryService from "repository/services";
import { autoInjectable } from "tsyringe";
import Utils from "utils";
import ErrorHandler from "utils/error-handler.utils";
import { Controller } from "../common/services/controller.service";
import CryptoService from "../common/services/crypto.service";
@autoInjectable()
export default class AuthMiddleware extends Controller {
  private readonly ACCESS_DENIED = "Invalid token";
  private userRepository = new RepositoryService<UserEntity>(UserEntity);
  constructor(private utils: Utils, private cryptoService: CryptoService) {
    super();
  }
  public validateToken = async (
    request: CustomRequest<UserEntity>,
    response: Response,
    next: NextFunction
  ) => {
    let token = this.utils.getBearerFromHeader(request.headers);
    if (!token)
      return next(
        new ErrorHandler(this.ACCESS_DENIED, HttpStatus.UNAUTHORIZED)
      );
    const id = await this.cryptoService.verify(token);
    const userData = await this.userRepository.getById(id);
    if (userData) {
      request.data = userData;
      response.cookie("token", token, {
        maxAge: Number(process.env.TOKEN_EXP),
      });
      return next();
    }
    next(new ErrorHandler(this.ACCESS_DENIED, HttpStatus.UNAUTHORIZED));
  };
  public verifyAdminPermission = (
    permission: PermissionRoleType | PermissionRoleType[]
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      let token = this.utils.getBearerFromHeader(request.headers);
      if (!token) {
        return next(
          new ErrorHandler(this.ACCESS_DENIED, HttpStatus.UNAUTHORIZED)
        );
      }
      const userData = request.data;
      const myPermissions =
        typeof userData.permission === "string"
          ? [userData.permission]
          : userData.permission;
      const targetPermissions =
        typeof permission === "string" ? [permission] : permission;
      if (
        !this.utils.checkTwoArrays<PermissionRoleType>(
          myPermissions,
          targetPermissions
        )
      )
        return next(
          new ErrorHandler("You dont have permission", HttpStatus.FORBIDDEN)
        );
      next();
    };
  };
  public validatePermissionOnDemand = (
    validator: (
      request: CustomRequest<UserEntity>,
      response: (flag: boolean) => void
    ) => void
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      validator(request, (flag: boolean) => {
        if (flag) return next();
        next(
          new ErrorHandler("You don't have permission", HttpStatus.FORBIDDEN)
        );
      });
    };
  };
}
