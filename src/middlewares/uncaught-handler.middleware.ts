import { NextFunction, Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import ErrorHandler from "utils/error-handler.utils";

@autoInjectable()
export default class UncaughtHandlerMiddleware {
  catch = (_, __, next: NextFunction) => {
    process.on("uncaughtException", (e: Error) => next(e));
    process.on("unhandledRejection", (e: Error) => next(e));
    next();
  };
}
