import { PermissionRoleType } from "interfaces/entities.interface";
import { JsonProperty } from "jackson-js";
import { Column, Entity } from "typeorm";
import { Audit } from "./Audit";
import { RepositoryEntity } from "../services";
import { Joi } from "celebrate";

@Entity("invitation")
export class UserEntity extends Audit {
  @JsonProperty()
  @Column({ type: "string" })
  public description: string;
  @Column({ type: "string" })
  public ownerId: any;
  @Column({ type: "string" })
  public recipientId: any;
  @JsonProperty()
  @Column({ type: "enum" })
  public type:
    | RepositoryEntity.DEPARTMENT
    | RepositoryEntity.PROGRAM
    | RepositoryEntity.SUBJECT;
  @JsonProperty()
  @Column({ type: "array" })
  public permissions: PermissionRoleType[];
  @JsonProperty()
  @Column({ type: "string" })
  public typeId: string;

  public readonly createSchema = Joi.object({
    description: Joi.string(),
    type: Joi.array()
      .items(
        RepositoryEntity.DEPARTMENT,
        RepositoryEntity.PROGRAM,
        RepositoryEntity.SUBJECT
      )
      .required()
      .unique()
      .error(
        new Joi.ValidationError(
          `type missing must be either : ${[
            RepositoryEntity.DEPARTMENT,
            RepositoryEntity.PROGRAM,
            RepositoryEntity.SUBJECT,
          ].join(", ")} `,
          null,
          null
        )
      ),
    permissions: Joi.array()
      .items(PermissionRoleType)
      .required()
      .unique()
      .error(
        new Joi.ValidationError(
          `permissions required : ${[
            PermissionRoleType.DIRECTOR,
            PermissionRoleType.TEACHER,
          ].join(", ")} `,
          null,
          null
        )
      ),
    typeId: Joi.string().required(),
  });

  constructor() {
    super();
  }
}
