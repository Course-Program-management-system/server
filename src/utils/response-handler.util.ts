import { HttpStatus } from "interfaces";

export default class ResponseHandler {
  public httpStatus: HttpStatus;
  public message: any;
  constructor(message: any, httpStatus?: HttpStatus) {
    this.httpStatus = httpStatus;
    this.message = message;
  }
}
