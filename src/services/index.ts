import Router from "common/services/common-router.service";
import express, { Request } from "express";
import { CustomRouter, HttpStatus } from "interfaces";
import { autoInjectable, container } from "tsyringe";
import Utils from "utils";
import ErrorHandler from "utils/error-handler.utils";
import Merchant from "./merchant/attainment";
@autoInjectable()
export default class Service extends Router implements CustomRouter {
  constructor(private utils: Utils) {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.put("*", (req, res, next) => {
      if (req.body.constructor === Object && Object.keys(req.body).length === 0)
        return next(
          new ErrorHandler("Body cannot be empty", HttpStatus.BAD_REQUEST)
        );
      next();
    });
    this.serviceApp.use("/v1", container.resolve(Merchant).getRouter());
    this.serviceApp.use((_, __, next) =>
      next(new ErrorHandler("Route not found", HttpStatus.NOT_FOUND))
    );
  }
  public getRouter(): express.Application {
    return this.serviceApp;
  }
}
