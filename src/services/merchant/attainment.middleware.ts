import { Controller } from "common/services";
import { NextFunction, Response } from "express";
import { HttpStatus, PermissionTypes, RequestMethod } from "interfaces";
import { CustomRequest } from "interfaces/payload.interface";
import DepartmentEntity from "repository/entity/Department.entity";
import ProgramEntity from "repository/entity/Program.entity";
import { SubjectEntity } from "repository/entity/subject-entity";
import { UserEntity } from "repository/entity/User";
import RepositoryService, { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import { FindConditions } from "typeorm";
import ErrorHandler from "utils/error-handler.utils";
import ResponseHandler from "utils/response-handler.util";
import AttainmentService from "./attainment.service";
export type EntityInstance =
  | ProgramEntity
  | SubjectEntity
  | UserEntity
  | DepartmentEntity;
type SetRepository = (request: CustomRequest<UserEntity>) => RepositoryEntity;
@autoInjectable()
export default class AttainmentMiddleware extends Controller {
  constructor(private attainmentService: AttainmentService) {
    super();
  }
  verifyEntityData = (
    type: RepositoryEntity,
    checkOwnership?: boolean,
    forwardData?: boolean,
    setRepository?: SetRepository,
    customParamId?: string
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      type = setRepository?.(request) || type;
      const responseData = await this.attainmentService.verifyEntityData(
        type,
        request.data,
        request.params[customParamId || `${type}Id`],
        checkOwnership
      );
      if (!responseData)
        return next(
          new ErrorHandler(`${type} not found`, HttpStatus.NOT_FOUND)
        );
      if (forwardData) {
        response.locals.data = {
          [type]: responseData,
        };
      }
      next();
    };
  };
  verifyUniqueBean = (
    type: RepositoryEntity,
    property: string,
    isUpdate?: boolean,
    setRepository?: SetRepository,
    customParamId?: string
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      if (!request.body[property]) return next();
      const entity = this.getEntity(request, type, setRepository);
      const notEqual = isUpdate
        ? {
            _id: {
              $ne: entity.setId(request.params[customParamId || `${type}Id`]),
            },
          }
        : {};
      if (
        await entity.get({
          where: {
            // collegeId: request.data.collegeId,
            [property]: request.body[property],
            ...notEqual,
          },
        })
      ) {
        return next(
          new ErrorHandler(
            `${type} with this ${property} already exists`,
            HttpStatus.BAD_REQUEST
          )
        );
      }
      next();
    };
  };

  updateBean = (
    type: RepositoryEntity,
    setRepository?: SetRepository,
    customParamId?: string
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      const entity = this.getEntity(request, type, setRepository);
      const paramId = request.params[customParamId || `${type}Id`];
      await entity.update(paramId, entity.getEntityObject(request.body) as any);
      return next(
        new ResponseHandler(await entity.getById(paramId), HttpStatus.SUCCESS)
      );
    };
  };
  delete = (
    type: RepositoryEntity,
    setRepository?: SetRepository,
    customParamId?: string
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      const entity = this.getEntity(request, type, setRepository);
      next(
        new ResponseHandler(
          await entity.delete({
            _id: entity.setId(request.params[customParamId || `${type}Id`]),
          }),
          HttpStatus.NO_CONTENT
        )
      );
    };
  };
  create = <T extends EntityInstance>(
    type: RepositoryEntity,
    cb: (entity: T, request: CustomRequest<UserEntity>) => void
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      const entity = RepositoryService.getRepository(type);
      const entityData = entity.getEntityObject(request.body);
      cb(entityData as T, request);
      next(
        new ResponseHandler(
          await entity.create(entityData as any),
          HttpStatus.CREATED
        )
      );
    };
  };

  getById = (
    type: RepositoryEntity,
    checkOwnership?: boolean,
    setRepository?: SetRepository | null,
    customParamId?: string | null,
    callback?: (
      request: CustomRequest<UserEntity>,
      options: any,
      response: Response
    ) => void
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      const entity = this.getEntity(request, type, setRepository);
      const ownership = checkOwnership
        ? this.attainmentService.getValidateOwnership(request.data._id, [
            PermissionTypes.READ,
          ])
        : {};
      let options = {
        where: {
          // collegeId: request.data.collegeId,
          _id: entity.setId(request.params[customParamId || `${type}Id`]),
          ...ownership,
        },
      };
      callback?.(request, options, response);
      const bean = await entity.get(options);
      if (!bean) {
        return next(
          new ErrorHandler(`${type} not found`, HttpStatus.NOT_FOUND)
        );
      }
      next(new ResponseHandler(bean, HttpStatus.SUCCESS));
    };
  };

  verifyOwnerEntityAction = (
    paramId: string,
    type: RepositoryEntity | null,
    setRepository?: SetRepository
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      type = setRepository?.(request) || type;
      let data = response.locals.data?.[type];
      if (!data) {
        const repository = this.getEntity(request, type, setRepository);
        data = await repository.get({
          where: {
            _id: repository.setId(request.params[paramId]),
          },
        });
        if (!data)
          return this.send(
            next,
            false,
            `${type} not found`,
            HttpStatus.NOT_FOUND
          );
      }
      if (
        !this.attainmentService.validatePermission(
          data?.permission,
          request.method as RequestMethod,
          request.data._id
        )
      )
        return this.send(
          next,
          false,
          "You don't have permission to perform this action",
          HttpStatus.FORBIDDEN
        );
      next();
    };
  };

  getAll = <Entity>(
    type: RepositoryEntity,
    checkOwnership?: boolean,
    callback?: (
      request: CustomRequest<UserEntity>,
      options: FindConditions<Entity>,
      response: Response
    ) => void,
    setRepository?: SetRepository
  ) => {
    return async (
      request: CustomRequest<UserEntity>,
      response: Response,
      next: NextFunction
    ) => {
      const { skip, take } = request.query;
      const entity = this.getEntity(request, type, setRepository);
      const ownership: any = checkOwnership
        ? this.attainmentService.getValidateOwnership(request.data._id, [
            PermissionTypes.READ,
          ])
        : {};
      const options = {
        where: {
          ...ownership,
        },
      };
      const pagination = {
        ...(skip ? { skip: Number(skip) } : {}),
        ...(take ? { take: Number(take) } : {}),
      };
      callback?.(request, options, response);
      const bean = await entity.getAll({ ...options, ...pagination });
      next(
        new ResponseHandler(
          { items: bean, total: await entity.getCount(options.where) },
          HttpStatus.SUCCESS
        )
      );
    };
  };

  private getEntity(
    request: CustomRequest<UserEntity>,
    type: RepositoryEntity,
    setRepository?: SetRepository
  ) {
    const entity = setRepository?.(request);
    return (
      (entity && RepositoryService.getRepository(entity)) ||
      RepositoryService.getRepository(type)
    );
  }
}
