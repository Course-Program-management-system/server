// import { Section } from "interfaces/entities.interface";
import { PermissionEntity } from "interfaces";
import { JsonProperty } from "jackson-js";
import { Column, Entity } from "typeorm";
import { Audit } from "../Audit";
import ExamTypes from "./ExamTypes.entity";
@Entity("college-department-program-subject")
export class SubjectEntity extends Audit {
  @JsonProperty()
  @Column()
  public name: string;
  @JsonProperty()
  @Column()
  public code: number;
  @JsonProperty()
  @Column()
  public examTypes: ExamTypes[];
  @Column()
  public programId: any;
  @Column()
  public permission: PermissionEntity;

  constructor(subject?: any) {
    super();
    if (subject) {
      Object.assign(this, subject);
    }
  }
}
