import express, { Application, NextFunction, Request, Response } from "express";
import { HttpStatus } from "interfaces";
import { autoInjectable } from "tsyringe";
import { Controller } from ".";
@autoInjectable()
export default class Router {
  protected serviceApp: Application;
  constructor() {
    // super();
    this.serviceApp = express();
  }
  protected attachMiddleware(
    middleware: (
      request: Request,
      response: Response,
      next?: NextFunction
    ) => void,
    instance: any,
    data?: any
  ) {
    return (request: Request, response: Response, next?: NextFunction) => {
      if (data) {
        response.locals.data = data;
      }
      return middleware.bind(instance)(request, response, next);
    };
  }
}
