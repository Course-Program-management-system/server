import { ValidationOptions } from "joi";
import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "interfaces";
import { CustomResponse } from "interfaces/payload.interface";
import { ObjectSchema, ArraySchema } from "joi";
import { autoInjectable } from "tsyringe";
import { Controller } from "../common/services/controller.service";
import ErrorHandler from "utils/error-handler.utils";
import ResponseHandler from "utils/response-handler.util";
type MiddlewareResponse = (
  request: Request,
  response: Response,
  next: NextFunction
) => void;
@autoInjectable()
export default class BeanValidateMiddleware extends Controller {
  constructor() {
    super();
  }

  public validateSchema<Schema>(
    schemaObject: ObjectSchema<Schema> | ArraySchema,
    body: any,
    returnError?: boolean,
    validationOptions?: ValidationOptions
  ): boolean | string {
    const validatedResponse = schemaObject.validate(body, validationOptions);
    if (validatedResponse.error) {
      if (returnError)
        return validatedResponse.error.details
          ?.map(({ message }) => message)
          .join(", ");
      return false;
    }
    return true;
  }

  public validate<Schema>(
    schemaObject: ObjectSchema<Schema> | ArraySchema,
    validationOptions?: ValidationOptions,
    schemaOnDemand?: (
      request: Request
    ) => ObjectSchema<Schema> | ArraySchema | boolean
  ): MiddlewareResponse {
    return (request: Request, response: any, next: NextFunction) => {
      const onDemand = schemaOnDemand?.(request);
      if (onDemand === true) return next();
      schemaObject = onDemand || schemaObject;
      const validatedResponse = schemaObject.validate(
        request.body,
        validationOptions
      );
      if (validatedResponse.error)
        return next(
          new ResponseHandler(
            validatedResponse.error.details
              ?.map(({ message }) => message)
              .join(", "),
            HttpStatus.BAD_REQUEST
          )
        );
      next();
    };
  }
}
