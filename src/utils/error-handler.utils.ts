import { HttpStatus } from "interfaces";

export default class ErrorHandler extends Error {
  public statusCode: HttpStatus;
  private static readonly defaultError = "INTERNAL_SERVER_ERROR";
  public stackTrace: string | null = null;
  public isErrorInstance: boolean = false;
  constructor(error: string | Error, httpStatus?: HttpStatus) {
    super(
      error
        ? typeof error === "string"
          ? error
          : error.message || ErrorHandler.defaultError
        : ErrorHandler.defaultError
    );
    this.isErrorInstance = error instanceof Error;
    this.stackTrace = error instanceof Error ? error.stack : null;
    this.statusCode = httpStatus || HttpStatus.UNKNOWN;
  }
}
