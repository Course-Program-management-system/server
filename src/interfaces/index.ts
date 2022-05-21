import { PermissionRoleType, User } from "./entities.interface";
import express, { NextFunction, Request, Response } from "express";
import { RepositoryEntity } from "repository/services";

export enum HttpStatus {
  SUCCESS = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNKNOWN = 500,
}
export interface CustomRouter {
  initializeRouter: () => void;
  getRouter: () => express.Application;
}
export interface ControllerServiceResponse {
  status?: number;
  empty?: boolean;
  response?: any;
}

export interface ISuperUser<T = unknown> extends Request {
  superUser: User;
  extra: T;
}
export interface Decorator<T> {
  class: T;
}
export interface BeanValidatorMiddleware {
  // postRequiredSchema: string[];
  // putRequiredSchema: string[];
  schema: any;
}
export interface VerifySuperAdminPayload {
  collegeName: string;
  email: string;
  date?: number;
}
export enum PermissionTypes {
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}
export interface PermissionEntity {
  [id: string]: Array<PermissionTypes>;
}
export interface VerifyAdminPayload {
  name: string;
  email: string;
  date?: number;
  role: PermissionRoleType.DIRECTOR | PermissionRoleType.TEACHER;
  entityKey: "departmentId" | "programId";
  permission: Array<PermissionTypes>;
  entityParamData: string;
  repositoryEntity:
    | RepositoryEntity.DEPARTMENT
    | RepositoryEntity.PROGRAM
    | RepositoryEntity.SUBJECT;
}
export enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}
