import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "interfaces";
import Repository from "repository";
import { autoInjectable } from "tsyringe";
import ErrorHandler from "utils/error-handler.utils";
import ResponseHandler from "utils/response-handler.util";

@autoInjectable()
export default class ForwardByIdMiddleware {
  forward<Entity>(
    entity: new () => Entity,
    error: string,
    beanKey: string,
    queryDataKey: string,
    queryKey: string,
    isId?: boolean
  ) {
    return async (request: Request, response: Response, next: NextFunction) => {
      const respository = new Repository();
      const where = {
        [queryDataKey]: isId
          ? respository.setId(request.params[queryKey])
          : request.params[queryKey],
      };
      const entityResponse = await respository
        .getManager()
        .findOne<Entity>(entity, {
          where,
        });
      if (!entityResponse) {
        return next(
          new ResponseHandler(
            error || `${beanKey} not found`,
            HttpStatus.NOT_FOUND
          )
        );
      }
      response.locals[beanKey] = entityResponse;
      next();
    };
  }
}
