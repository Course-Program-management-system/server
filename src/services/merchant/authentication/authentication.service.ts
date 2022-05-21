import { CryptoService } from "common/services";
import {
  PermissionTypes,
  VerifyAdminPayload,
  VerifySuperAdminPayload,
} from "interfaces";
import { PermissionRoleType } from "interfaces/entities.interface";
import { CollegeEntity } from "repository/entity/College.entity";
import { UserEntity } from "repository/entity/User";
import RepositoryService, { RepositoryEntity } from "repository/services";
import { autoInjectable } from "tsyringe";
import Utils from "utils";
import MailService from "utils/node-mailer";

@autoInjectable()
export default class AuthenticationService {
  public readonly verifyAdminExpiry = 300;
  private readonly userEntity = new RepositoryService<UserEntity>(UserEntity);
  private readonly collegeEntity = new RepositoryService<CollegeEntity>(
    CollegeEntity
  );
  constructor(
    private utils: Utils,
    private cryptoService: CryptoService,
    private mailService: MailService
  ) {}
  public createSuperAdmin = async (
    password: string,
    verifySuperAdminPayload: VerifySuperAdminPayload
  ): Promise<UserEntity> => {
    const { email, collegeName } = verifySuperAdminPayload;
    const collegeEntity = new CollegeEntity();
    collegeEntity.name = collegeName;
    const createdCollege = await this.collegeEntity.create(collegeEntity);
    const userEntity = new UserEntity();
    userEntity.collegeId = createdCollege._id;
    userEntity.email = email; //hashedEmail;
    userEntity.password = this.cryptoService.gethash(password);
    userEntity.permission = [PermissionRoleType.UNIVERSITY];
    return this.userEntity.create(userEntity);
  };
  public verifyEmailAuthenticity = async (email: string): Promise<boolean> => {
    if (await this.userEntity.get({ where: { email } })) return true;
    return false;
  };

  public verifyCollegeExists = async (name: string): Promise<boolean> => {
    if (await this.collegeEntity.get({ where: { name } })) return true;
    return false;
  };

  public sendMail = (
    route: "/verifysuperadmin" | "/verifyadmin" | "/changepassword",
    emails: string[],
    secrets: string[]
  ): Promise<string[] | void> => {
    return new Promise(async (resolve) => {
      const mailBodies = emails.map((email, index) => {
        const url = `${route}?verify=${secrets[index]}`;
        return this.mailService.generateMailBody(
          email,
          this.mailService.getVerifyAdminHtml(secrets[index], url),
          "Verify email",
          "high"
        );
      });
      const promises = mailBodies.map((mailBody) =>
        this.mailService.sendMail(mailBody, true)
      );
      (mailBodies.length === 1 && (await Promise.all(promises))) ||
        Promise.all(promises);
      if (this.utils.isProduction()) return resolve(secrets);
      resolve(secrets);
    });
  };

  public getRegisterAdminPayload = (
    typeId: string,
    type: string,
    email: string[],
    name: string[],
    permissions: PermissionTypes[][],
    files: Express.Multer.File[]
  ): { email: string[]; secrets: string[] } => {
    if (files) {
      const sheetData = this.utils.parseSheetToJson(files, "file");
      const emailSet = new Set<string>();
      const names: Array<string> = [];
      const excelPermissions: PermissionTypes[][] = [];
      sheetData.forEach(({ email, name, permissions }) => {
        emailSet.add(email);
        names.push(name || "-");
        excelPermissions.push(permissions?.split(",") || []);
      });
      email = Array.from(emailSet);
      name = names;
      permissions = excelPermissions;
    }
    const secrets = email.map((e, i) => {
      const data: VerifyAdminPayload = {
        name: name[i],
        date: Date.now(),
        email: e,
        role:
          type === "department"
            ? PermissionRoleType.DIRECTOR
            : PermissionRoleType.TEACHER,
        entityKey: `${type}Id` as "programId" | "departmentId",
        entityParamData: typeId,
        repositoryEntity:
          type === "department"
            ? RepositoryEntity.DEPARTMENT
            : type === "program"
            ? RepositoryEntity.PROGRAM
            : RepositoryEntity.SUBJECT,
        permission: permissions[i],
      };
      return this.cryptoService.encrypt(JSON.stringify(data));
    });
    return { secrets, email };
  };

  public updateUserPassword = (
    email: string,
    password: string
  ): Promise<any> => {
    return this.userEntity
      .getManager()
      .updateOne(
        UserEntity,
        { email },
        { $set: { password: this.cryptoService.gethash(password) } }
      );
  };

  public deleteUserById = async (
    owner: UserEntity,
    type: "department" | "program" | "subject",
    typeId: string,
    userId: string
  ): Promise<true | string> => {
    const entity =
      type === "department"
        ? RepositoryEntity.DEPARTMENT
        : type === "program"
        ? RepositoryEntity.PROGRAM
        : RepositoryEntity.SUBJECT;
    const repo = RepositoryService.getRepository(entity);
    const user = await this.userEntity.getById(userId);
    if (!user) return "User not found";
    if (!this.checkDeletePermission(owner, user))
      return "You don't have permission";
    await repo.getManager().findOneAndUpdate(
      repo.getEntity(),
      { _id: repo.setId(typeId) },
      {
        $unset: { [`permission.${userId}`]: "" },
      }
    );
    return true;
  };

  public createAdmin = (
    data: VerifyAdminPayload,
    password: string
  ): Promise<string | UserEntity> => {
    return new Promise(async (resolve) => {
      const userEntity = new UserEntity();
      const existingUser = await this.userEntity.get({
        where: { email: data.email },
      });
      if (existingUser) {
        if (existingUser.password !== this.cryptoService.gethash(password))
          return resolve("Invalid password");
        if (!existingUser.permission?.includes(data.role))
          return resolve(
            `Cannot assign already existing user with another permission`
          );
      } else {
        userEntity.email = data.email; //this.cryptoService.gethash(email);
        userEntity.password = this.cryptoService.gethash(password);
        userEntity.permission =
          data.role === PermissionRoleType.DIRECTOR
            ? [data.role, PermissionRoleType.TEACHER]
            : [data.role];
      }
      const repository = RepositoryService.getRepository(data.repositoryEntity);
      const user = existingUser || (await this.userEntity.create(userEntity));
      const ownerId = user?._id || user._id;
      await repository.getManager().updateOne(
        repository.getEntity(),
        { _id: repository.setId(data.entityParamData) },
        {
          $set: {
            [`permission.${ownerId}`]: [PermissionTypes.READ],
          },
        }
      );
      resolve(user);
    });
  };

  private checkDeletePermission(
    owner: UserEntity,
    targetUser: UserEntity
  ): boolean {
    return (
      owner.permission.includes(PermissionRoleType.UNIVERSITY) ||
      (owner.permission.includes(PermissionRoleType.DIRECTOR) &&
        !this.utils.checkTwoArrays<PermissionRoleType>(targetUser.permission, [
          PermissionRoleType.UNIVERSITY,
        ])) ||
      (owner.permission.includes(PermissionRoleType.TEACHER) &&
        !this.utils.checkTwoArrays<PermissionRoleType>(targetUser.permission, [
          PermissionRoleType.DIRECTOR,
          PermissionRoleType.UNIVERSITY,
        ]))
    );
  }
}
