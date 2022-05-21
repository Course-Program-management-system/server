import { PermissionEntity } from "interfaces";
import { JsonProperty } from "jackson-js";
import { Column, Entity } from "typeorm";
import { Audit } from "./Audit";
interface ProgramData {
  name: string;
  description;
}
@Entity("college-department-program")
export default class ProgramEntity extends Audit {
  @JsonProperty()
  @Column({ nullable: false, type: "string" })
  name: String;
  @JsonProperty()
  @Column({ type: "array" })
  programOutcomes: Array<ProgramData>;
  @JsonProperty()
  @Column({ type: "array" })
  programSpecificOutcomes: Array<ProgramData>;
  @Column()
  public departmentId: any;
  @Column()
  public permission: PermissionEntity;
  constructor() {
    super();
  }
}
