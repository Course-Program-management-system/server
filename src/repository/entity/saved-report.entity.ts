import { Column, Entity } from "typeorm";
import { Audit } from "./Audit";
@Entity("saved-report")
export class SavedReportEntity extends Audit {
  @Column()
  public subjectId: any;
  @Column()
  public examTypeId: any;
  @Column()
  public name: string;
  @Column()
  public section: string | null;
  @Column({ type: "array" })
  public courseOutcomes: SavedReportCourseOutcomes[];
  @Column({ type: "array" })
  public programOutcomes: SavedReportProgramOutcomes[];
  @Column({ type: "array" })
  public marks: SavedReportMarks[];

  constructor() {
    super();
  }

  setBean(
    name: string,
    subjectId: any,
    courseOutcomes: SavedReportCourseOutcomes[],
    programOutcomes: SavedReportProgramOutcomes[],
    marks: SavedReportMarks[],
    examTypeId?: null | any,
    section?: null | string
  ) {
    this.name = name;
    this.subjectId = subjectId;
    this.courseOutcomes = courseOutcomes;
    this.programOutcomes = programOutcomes;
    this.marks = marks;
    this.section = !section ? null : section;
    this.examTypeId = examTypeId;
    return this;
  }
}

export class SavedReportMarks {
  public name: string;
  public id: string;
  public marks: number[];
  constructor(name: string, id: string, marks: number[]) {
    this.name = name;
    this.id = id;
    this.marks = marks;
  }
}
export class SavedReportProgramOutcomes {
  public name: string;
  public attainment: number;
  constructor(name: string, attainment: number) {
    this.name = name;
    this.attainment = attainment;
  }
}

export class SavedReportCourseOutcomes {
  public name: string;
  public attainment: number;
  public questionsAttempted: number;
  public passedTarget: number;
  public improvementRequired: boolean;
  public percentage: number;
  constructor(
    name: string,
    attainment: number,
    questionsAttempted: number,
    passedTarget: number,
    improvementRequired: boolean,
    percentage: number
  ) {
    this.name = name;
    this.questionsAttempted = questionsAttempted;
    this.attainment = attainment;
    this.improvementRequired = improvementRequired;
    this.percentage = percentage;
    this.passedTarget = passedTarget;
  }
}
