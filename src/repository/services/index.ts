import { ObjectMapper } from "jackson-js";
import { ObjectId } from "mongodb";
import Repository from "repository";
import DepartmentEntity from "repository/entity/Department.entity";
import ProgramEntity from "repository/entity/Program.entity";
import { SavedReportEntity } from "repository/entity/saved-report.entity";
import { SubjectEntity } from "repository/entity/subject-entity";
import { UserEntity } from "repository/entity/User";
import { autoInjectable } from "tsyringe";
import {
  DeleteWriteOpResultObject,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  RemoveOptions,
} from "typeorm";
export enum RepositoryEntity {
  PROGRAM = "program",
  SUBJECT = "subject",
  DEPARTMENT = "department",
  USER = "user",
  SAVED_REPORT = "report",
}
@autoInjectable()
export default class RepositoryService<Entity = unknown> extends Repository {
  private entity: new () => Entity;
  constructor(entity: new () => Entity) {
    super();
    this.entity = entity;
  }

  public setEntity(entity: new () => Entity) {
    this.entity = entity;
  }

  public getEntityObject<T>(data: Entity, entityClass?: any): T | Entity {
    return new ObjectMapper().parse<Entity>(JSON.stringify(data), {
      features: { deserialization: { FAIL_ON_UNKNOWN_PROPERTIES: false } },
      mainCreator: () => [entityClass || this.entity],
    });
  }
  public create(beanInstance: Entity): Promise<Entity> {
    return this.getManager().save(this.entity, beanInstance);
  }

  public update(id: string, beanInstance: Entity, unset?: any) {
    return this.getManager().findOneAndUpdate(
      this.entity,
      {
        _id: this.setId(id),
      },
      unset ? { $set: beanInstance, $unset: unset } : { $set: beanInstance }
    );
  }
  public updateCustom(id: string, ownerId: string, options: any) {
    return this.getManager().findOneAndUpdate(
      this.entity,
      {
        _id: this.setId(id),
        ownerId: this.setId(ownerId),
      },
      options
    );
  }

  public get(options: FindOneOptions<Entity>): Promise<Entity> {
    return this.getManager().findOne(this.entity, options);
  }

  public getById(id: string | ObjectId): Promise<Entity> {
    return this.getManager().findOne(this.entity, {
      where: { _id: id instanceof ObjectId ? id : this.setId(id) },
    });
  }
  public getAll(options: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.getManager().find<Entity>(this.entity, options);
  }
  public getCount(query?: ObjectLiteral): Promise<number> {
    return this.getManager().count(this.entity, query);
  }
  public delete(options?: any): Promise<Entity> {
    return this.getManager().remove<Entity>(this.entity as any, options);
  }
  public deleteMany(
    options: ObjectLiteral
  ): Promise<DeleteWriteOpResultObject> {
    return this.getManager().deleteMany(this.entity, options);
  }

  public getEntity(): new () => Entity {
    return this.entity;
  }

  public static getRepository(
    repository: RepositoryEntity
  ):
    | RepositoryService<DepartmentEntity>
    | RepositoryService<ProgramEntity>
    | RepositoryService<SubjectEntity>
    | RepositoryService<UserEntity>
    | RepositoryService<SavedReportEntity> {
    switch (repository) {
      case RepositoryEntity.PROGRAM:
        return new RepositoryService<ProgramEntity>(ProgramEntity);
      case RepositoryEntity.SUBJECT:
        return new RepositoryService<SubjectEntity>(SubjectEntity);
      case RepositoryEntity.DEPARTMENT:
        return new RepositoryService<DepartmentEntity>(DepartmentEntity);
      case RepositoryEntity.USER:
        return new RepositoryService<UserEntity>(UserEntity);
      case RepositoryEntity.SAVED_REPORT:
        return new RepositoryService<SavedReportEntity>(SavedReportEntity);
    }
  }
}
