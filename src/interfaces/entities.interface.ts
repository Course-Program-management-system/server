import { ObjectId } from "mongoose";

export interface User extends Audit {
  name: string;
  mobileNumber: string;
}
export interface _ObjectId {
  _id: ObjectId;
}
export interface Audit extends _ObjectId {
  createdAt: string;
  // updatedAt: string;
}
export interface School extends Audit {
  name: String;
  classes: Array<Class>;
}
export interface Class extends _ObjectId {
  name: String;
  subjects: Array<ObjectId>;
}
// export interface Subject extends Audit {
//   name: String;
//   teacher: String;
//   section: String;
//   studentsCount: String;
//   attainment: number;
//   sections: Array<Section>;
// }
// export interface Section extends _ObjectId {
//   name: String;
//   questions: Array<Question>;
// }
// export interface Question extends _ObjectId {
//   name: String;
//   marks: number;
// }
export enum PermissionRoleType {
  UNIVERSITY = "UNIVERSITY",
  DIRECTOR = "DIRECTOR",
  TEACHER = "TEACHER",
}
type PermissionRole = PermissionRoleType;
export interface AdminUser extends Audit {
  permission: PermissionRole;
  email: string;
}
