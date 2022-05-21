import { Router } from "common/services";
import { Application, NextFunction, Request, Response } from "express";
import { CustomRouter, HttpStatus } from "interfaces";
import { autoInjectable } from "tsyringe";
import Utils from "utils";
import ErrorHandler from "utils/error-handler.utils";
import ResponseHandler from "utils/response-handler.util";
interface ValidIps {
  [ip: string]: boolean;
}
@autoInjectable()
export default class IpWhitelistMiddleware
  extends Router
  implements CustomRouter
{
  private readonly PROTECTED_ROUTE =
    "/61d502482fce367faf9d6f65a81b10ab3b62860d5ff062b97aecc45f1c1872e2";
  private static validIps: ValidIps = {};
  constructor(private utils: Utils) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.get(
      this.PROTECTED_ROUTE,
      async (req: Request, res: Response, next: NextFunction) => {
        IpWhitelistMiddleware.validIps[(await this.utils.getIp()).toString()] =
          true;
        return next(
          new ResponseHandler("IP added successfully", HttpStatus.SUCCESS)
        );
      }
    );
    this.serviceApp.delete(
      this.PROTECTED_ROUTE,
      async (req: Request, res: Response, next: NextFunction) => {
        const { ip } = req.query;
        delete IpWhitelistMiddleware.validIps[
          ip.toString() || (await this.utils.getIp()).toString()
        ];
        return next(
          new ResponseHandler("IP removed successfully", HttpStatus.SUCCESS)
        );
      }
    );
  }
  public CheckIp = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    if (
      IpWhitelistMiddleware.validIps[(await this.utils.getIp()).toString()] ||
      request.originalUrl === this.PROTECTED_ROUTE
    )
      return next();
    next(new ErrorHandler("RESTRICTED", HttpStatus.FORBIDDEN));
  };
  public getRouter(): Application {
    return this.serviceApp;
  }
}
