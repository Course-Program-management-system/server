import { JsonProperty } from "jackson-js";
import { Audit } from "../Audit";
import SectionQuestion from "./SectionQuestion";

export default class ExamTypes extends Audit {
  @JsonProperty()
  public name: string;
  @JsonProperty()
  public target: number;
  @JsonProperty()
  public sections: {
    questions: SectionQuestion[];
  }[];
  constructor() {
    super();
  }
}
