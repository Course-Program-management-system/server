import { PermissionRoleType } from "interfaces/entities.interface";
import { CollegeEntity } from "repository/entity/College.entity";
import DepartmentEntity from "repository/entity/Department.entity";
import ProgramEntity from "repository/entity/Program.entity";
import { SavedReportEntity } from "repository/entity/saved-report.entity";
import { SubjectEntity } from "repository/entity/subject-entity";
import { UserEntity } from "repository/entity/User";
import RepositoryService, { RepositoryEntity } from "repository/services";
import {
  AfterRemove,
  EntitySubscriberInterface,
  EventSubscriber,
  RemoveEvent,
} from "typeorm";
type SubscriberEventType =
  | ProgramEntity
  | SubjectEntity
  | SavedReportEntity
  | DepartmentEntity
  | UserEntity
  | CollegeEntity;
@EventSubscriber()
export default class ProgramSubscriber
  implements EntitySubscriberInterface<ProgramEntity | SubjectEntity>
{
  @AfterRemove()
  afterRemove(event: RemoveEvent<SubscriberEventType>): void | Promise<any> {
    const { databaseEntity } = event;
    if (databaseEntity instanceof CollegeEntity) {
      this.removeReferenceDocuments(event, RepositoryEntity.USER, "collegeId");
    } else if (databaseEntity instanceof DepartmentEntity) {
      this.removeReferenceDocuments(
        event,
        RepositoryEntity.USER,
        "departmentId"
      );
    } else if (databaseEntity instanceof ProgramEntity) {
      this.removeReferenceDocuments(event, RepositoryEntity.USER, "programId");
    } else if (databaseEntity instanceof SubjectEntity) {
      this.removeReferenceDocuments(
        event,
        RepositoryEntity.SAVED_REPORT,
        "subjectId"
      );
    } else if (databaseEntity instanceof UserEntity) {
      const { permission } = databaseEntity;
      if (permission.includes(PermissionRoleType.DIRECTOR)) {
        this.removeReferenceDocuments(
          event,
          RepositoryEntity.PROGRAM,
          "departmentId",
          true
        );
      }
      if (permission.includes(PermissionRoleType.TEACHER)) {
        this.removeReferenceDocuments(
          event,
          RepositoryEntity.SUBJECT,
          "programId",
          true
        );
      }
    }
  }

  private async removeReferenceDocuments(
    event: RemoveEvent<SubscriberEventType>,
    entity: RepositoryEntity,
    key: any,
    value?: boolean
  ) {
    const repository = RepositoryService.getRepository(entity);
    const objects = await repository.getAll({
      where: {
        [key]: repository.setId(
          value ? event.databaseEntity[key] : event.databaseEntity._id
        ),
      },
    });
    if (objects.length > 0) repository.delete(objects);
  }
}
