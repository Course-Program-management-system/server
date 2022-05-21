import { PermissionEntity } from "interfaces";
import { JsonProperty } from "jackson-js";
import { Column, Entity } from "typeorm";
import { Audit } from "./Audit";
@Entity("college-department")
export default class DepartmentEntity extends Audit {
  @JsonProperty()
  @Column({ nullable: false, type: "string" })
  name: String;
  @Column()
  public permission: PermissionEntity;
  constructor() {
    super();
  }
}
