import { JsonProperty } from "jackson-js";
import { Column, Entity } from "typeorm";
import { Audit } from "./Audit";

// @Entity("resource")
export class Resource {
  @Column({ type: "string" })
  public identifier: string;
  @Column({ type: "string" })
  public displayName: string;
  @Column({ type: "string" })
  public mimeType: string;
  @Column({ type: "number" })
  public size: number;
  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  public createdAt: string;
  @Column({ type: "string" })
  public path: string;

  public setName(displayName: string): this {
    this.displayName = displayName;
    return this;
  }
  public setIdentifier(identifier: string): this {
    this.identifier = identifier;
    return this;
  }
  public setMimeType(mimeType: string): this {
    this.mimeType = mimeType;
    return this;
  }
  public setSize(size: number): this {
    this.size = size;
    return this;
  }
  public setPath(path: string): this {
    this.path = path;
    return this;
  }
}
