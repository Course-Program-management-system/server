import {
  BeforeUpdate,
  Column,
  CreateDateColumn,
  ObjectIdColumn,
  UpdateDateColumn,
} from "typeorm";

export class Audit {
  @ObjectIdColumn()
  public _id: any;
  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  public createdAt: Date;
}
