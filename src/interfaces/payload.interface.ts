import { IncomingHttpHeaders } from "http";
import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "interfaces";
export interface MerchantAuthenticate {
  otp?: string;
  mobile?: string;
  token?: string;
}
export interface Headers extends IncomingHttpHeaders {
  authorization?: string;
}
export interface CustomRequest<T = unknown> extends Request {
  data: T;
}

export interface CustomResponse<T = unknown> extends Response {
  locals: {
    data: T;
  };
}
export interface ExpressResponse {
  request: Request;
  response: Response;
  next: NextFunction;
}
export type ServiceResponse<T> = {
  data?: T;
  error?: string;
  httpStatus?: HttpStatus;
};
