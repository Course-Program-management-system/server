import { NextFunction, Response } from "express";
import { ControllerServiceResponse, HttpStatus } from "interfaces";
import { autoInjectable } from "tsyringe";
import ErrorHandler from "utils/error-handler.utils";
import ResponseHandler from "utils/response-handler.util";
@autoInjectable()
export class Controller {
  protected static serviceResponse(
    response: Response,
    controllerServiceResponse: ControllerServiceResponse,
    route?: string
  ) {
    if (!controllerServiceResponse.empty) {
      return response.status(controllerServiceResponse.status).send({
        statusCode: controllerServiceResponse.status,
        message: controllerServiceResponse.response,
        route,
      });
    }
    return response.status(controllerServiceResponse.status).send();
  }
  protected handleUnexpectedException(
    response: Response,
    error: Error,
    route?: string
  ) {
    return response.status(HttpStatus.UNKNOWN).send({
      statusCode: HttpStatus.UNKNOWN,
      message: {
        error: "INTERNAL_SERVER_ERROR",
        errorType: error.name,
        message: error.stack,
      },
      route,
    });
  }
  protected sendResponse(
    response: Response,
    statusCode: number,
    message: string | object,
    route?: string
  ) {
    return response.status(statusCode).send({ statusCode, message, route });
  }
  protected handleFailedValidation(
    response: Response,
    message?: string,
    property?: string,
    route?: string
  ) {
    return response.status(HttpStatus.BAD_REQUEST).send({
      statusCode: HttpStatus.BAD_REQUEST,
      ...{ message, property },
      route,
    });
  }

  protected send(
    next: NextFunction,
    isSuccess?: boolean,
    data?: any | null,
    status?: HttpStatus
  ) {
    next(
      isSuccess
        ? new ResponseHandler(data, status)
        : new ErrorHandler(data, status)
    );
  }
}
