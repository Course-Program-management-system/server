// import { Section } from "interfaces/entities.interface";
import { JsonProperty } from "jackson-js";
import { Column, Entity } from "typeorm";
import { Audit } from "./Audit";
@Entity("college")
export class CollegeEntity extends Audit {
  @JsonProperty()
  @Column()
  public name: string;
  constructor() {
    super();
  }
}
