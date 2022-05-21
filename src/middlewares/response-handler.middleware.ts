import { Controller } from "common/services";
import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "interfaces";
import { autoInjectable } from "tsyringe";
import ErrorHandler from "utils/error-handler.utils";
import ResponseHandler from "utils/response-handler.util";

@autoInjectable()
export default class ResponseHandlerMiddleware extends Controller {
  constructor() {
    super();
  }
  get = (
    resp: ErrorHandler | ResponseHandler,
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    if (resp instanceof ResponseHandler) {
      return this.sendResponse(
        response,
        resp.httpStatus || HttpStatus.SUCCESS,
        resp.message,
        request.originalUrl
      );
    }
    this.sendResponse(
      response,
      resp.statusCode || HttpStatus.UNKNOWN,
      resp.isErrorInstance
        ? { error: resp.name, stack: resp.stack }
        : resp.message,
      request.originalUrl
    );
  };
}
