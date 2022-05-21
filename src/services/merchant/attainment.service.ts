import { PermissionRoleType } from "interfaces/entities.interface";
import { CustomRequest } from "interfaces/payload.interface";
import { UserEntity } from "repository/entity/User";
import RepositoryService, { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import { ObjectSchema, ArraySchema } from "joi";

import ProgramMiddleware from "./program/program.middleware";
import SubjectMiddleware from "./subject/subject.middleware";
import DepartmentMiddleware from "./department/department.middleware";
import Utils from "utils";
import { PermissionTypes, RequestMethod } from "interfaces";
import { ObjectID } from "typeorm";
import { ObjectId } from "mongodb";
@autoInjectable()
export default class AttainmentService {
  constructor(
    private utils: Utils,
    private programMiddleware: ProgramMiddleware,
    private subjectMiddleware: SubjectMiddleware,
    private departmentMiddleware: DepartmentMiddleware
  ) {}

  public verifyEntityData(
    type: RepositoryEntity,
    userData: UserEntity,
    paramId: string,
    checkOwnership?: boolean
  ): Promise<any | null> {
    return new Promise(async (resolve) => {
      const entity = RepositoryService.getRepository(type); //this.getEntity(type);
      const ownership = checkOwnership
        ? this.getValidateOwnership(userData._id, [PermissionTypes.READ])
        : {};
      const responseData = await entity.get({
        where: {
          _id: entity.setId(paramId),
          ...ownership,
        },
      });
      if (!responseData) return resolve(null);
      resolve(responseData);
    });
  }
  public verifyPermissions = (
    request: CustomRequest<UserEntity>,
    response: (flag: boolean) => void
  ) => {
    const userPermission = request.data.permission;
    const { type } = request.params;
    const requestType = request.method as RequestMethod;
    if (type === "department") {
      return response(
        (requestType === RequestMethod.GET &&
          this.utils.checkTwoArrays<PermissionRoleType>(
            [PermissionRoleType.DIRECTOR, PermissionRoleType.UNIVERSITY],
            userPermission as PermissionRoleType[]
          )) ||
          this.utils.checkTwoArrays<PermissionRoleType>(
            [PermissionRoleType.UNIVERSITY],
            userPermission as PermissionRoleType[]
          )
      );
    }
    response(
      this.utils.checkTwoArrays<PermissionRoleType>(
        [PermissionRoleType.TEACHER, PermissionRoleType.DIRECTOR],
        userPermission as PermissionRoleType[]
      )
    );
  };

  public getPutValidators = (
    request: CustomRequest<UserEntity>
  ): ObjectSchema<any> | ArraySchema => {
    const { type } = request.params;
    switch (type) {
      case RepositoryEntity.PROGRAM:
        return this.programMiddleware.updateSchema;
      case RepositoryEntity.SUBJECT:
        return this.subjectMiddleware.schemaUpdate;
      default:
        return this.departmentMiddleware.updateSchema;
    }
  };

  public getValidateOwnership = (
    ownerId: string,
    permissions: Array<PermissionTypes>,
    method?: RequestMethod[]
  ): any => {
    return {
      [`permission.${ownerId}`]: {
        $in:
          method?.map((method) => this.getPermissionType(method)) ||
          permissions,
      },
    };
  };

  public validatePermission = (
    permission: any,
    requestMethod: RequestMethod,
    ownerId: string
  ): boolean => {
    return (
      permission?.[ownerId]?.filter(
        (permission) =>
          `${permission}` === this.getPermissionType(requestMethod)
      ).length === 1
    );
  };

  private getPermissionType(requestMethod: RequestMethod): PermissionTypes {
    switch (requestMethod) {
      case RequestMethod.GET:
        return PermissionTypes.READ;
      case RequestMethod.DELETE:
        return PermissionTypes.DELETE;
      case RequestMethod.PUT:
        return PermissionTypes.UPDATE;
    }
    throw "PERMISSION NOT FOUND";
  }
}
