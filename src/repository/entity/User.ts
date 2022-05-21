import { PermissionRoleType } from "interfaces/entities.interface";
import { JsonProperty } from "jackson-js";
import { Column, Entity } from "typeorm";
import { Audit } from "./Audit";
@Entity("user")
export class UserEntity extends Audit {
  @JsonProperty()
  @Column({ type: "string" })
  public email: string;
  @JsonProperty()
  @Column({ type: "string" })
  public name: string;
  @JsonProperty()
  @Column({ type: "string" })
  public password: string;
  @Column({ type: "string" })
  public permission: Array<
    | PermissionRoleType.UNIVERSITY
    | PermissionRoleType.DIRECTOR
    | PermissionRoleType.TEACHER
  >;
  @Column()
  public collegeId: any;
  constructor() {
    super();
  }
}
