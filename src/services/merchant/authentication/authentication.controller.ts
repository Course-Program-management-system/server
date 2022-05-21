import { CryptoService } from "common/services";
import { Controller } from "common/services/controller.service";
import { NextFunction, Request, Response } from "express";
import {
  HttpStatus,
  VerifyAdminPayload,
  VerifySuperAdminPayload,
} from "interfaces";
import { CustomRequest } from "interfaces/payload.interface";
import { UserEntity } from "repository/entity/User";
import RepositoryService from "repository/services";
import { autoInjectable } from "tsyringe";
import Utils from "utils";
import ErrorHandler from "utils/error-handler.utils";
import ResponseHandler from "utils/response-handler.util";
import AuthenticationService from "./authentication.service";
@autoInjectable()
export default class AuthenticationController extends Controller {
  private userRepository = new RepositoryService<UserEntity>(UserEntity);
  constructor(
    private cryptoService: CryptoService,
    private utils: Utils,
    private service: AuthenticationService
  ) {
    super();
  }

  public verifySuperAdmin = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { password, authData } = request.body;
    const decrypedAuthData =
      this.cryptoService.decryptEmailAuthData<VerifySuperAdminPayload>(
        authData,
        this.service.verifyAdminExpiry
      );
    if (!decrypedAuthData)
      return this.send(next, false, "Invalid auth data", HttpStatus.FORBIDDEN);
    if (await this.service.verifyEmailAuthenticity(decrypedAuthData.email))
      return this.send(
        next,
        false,
        "User already exists",
        HttpStatus.BAD_REQUEST
      );
    const createdUser = await this.service.createSuperAdmin(
      password,
      decrypedAuthData
    );
    this.send(
      next,
      true,
      this.cryptoService.signIn(createdUser._id, true),
      HttpStatus.CREATED
    );
  };
  public registerSuperAdmin = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { collegeName, email, password } = request.body;
    if (await this.service.verifyCollegeExists(collegeName)) {
      return this.send(
        next,
        false,
        "College with this name already exists",
        HttpStatus.BAD_REQUEST
      );
    }
    const secret = this.cryptoService.encrypt(
      JSON.stringify({
        collegeName,
        email,
        date: Date.now(),
      } as VerifySuperAdminPayload)
    );
    this.send(
      next,
      true,
      await this.service.sendMail("/verifysuperadmin", [email], [secret])
    );
  };

  public login = async (
    request: CustomRequest<UserEntity>,
    response: Response,
    next: NextFunction
  ) => {
    const { email, password } = request.body;
    const userResponse = await this.userRepository.get({
      where: {
        email, //: this.cryptoService.gethash(email),
        password: this.cryptoService.gethash(password),
      },
    });
    if (!userResponse)
      return next(
        new ErrorHandler("Invalid email or password", HttpStatus.UNAUTHORIZED)
      );
    return next(
      new ResponseHandler(
        this.cryptoService.signIn(userResponse._id, true),
        HttpStatus.SUCCESS
      )
    );
  };

  public registerAdmin = async (
    request: CustomRequest<UserEntity>,
    response: Response,
    next: NextFunction
  ) => {
    const { typeId, type } = request.params;
    const { name, permission } = request.body;
    const files = request.files as Express.Multer.File[];
    const { secrets, email } = this.service.getRegisterAdminPayload(
      typeId,
      type,
      [request.body.email],
      [name],
      [permission],
      files
    );
    this.send(
      next,
      true,
      await this.service.sendMail("/verifyadmin", email, secrets)
    );
  };
  public changePassword = async (
    request: CustomRequest<UserEntity>,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { email, authData, password } = request.body;
      const { verify } = request.query;
      if (verify) {
        const [time, email] = this.cryptoService.decrypt(authData).split(",");
        if (
          this.utils.validateIfExpired(
            Number(time),
            this.service.verifyAdminExpiry
          )
        ) {
          return this.send(
            next,
            false,
            "Access denied",
            HttpStatus.UNAUTHORIZED
          );
        }
        await this.service.updateUserPassword(email, password);
        return this.send(next, true, "Password successfully updated");
      }
      this.send(
        next,
        true,
        await this.service.sendMail(
          "/changepassword",
          [email],
          [this.cryptoService.encrypt(`${Date.now()},${email}`)]
        )
      );
    } catch (e) {
      next(new ErrorHandler("INTERNAL_SERVER_ERROR", HttpStatus.UNKNOWN));
    }
  };
  public verifyAdmin = async (
    request: CustomRequest<UserEntity>,
    response: Response,
    next: NextFunction
  ) => {
    const { password, authData } = request.body;
    const data = this.cryptoService.decryptEmailAuthData<VerifyAdminPayload>(
      authData,
      this.service.verifyAdminExpiry
    );
    if (!data)
      return this.send(next, false, "Invalid auth data", HttpStatus.FORBIDDEN);
    const createAdminResponse = await this.service.createAdmin(data, password);
    if (!(createAdminResponse instanceof UserEntity))
      return this.send(next, false, createAdminResponse, HttpStatus.FORBIDDEN);
    this.send(
      next,
      true,
      this.cryptoService.signIn(createAdminResponse._id, true),
      HttpStatus.CREATED
    );
  };

  public deleteUserById = async (
    request: CustomRequest<UserEntity>,
    response: Response,
    next: NextFunction
  ) => {
    const { type, typeId, userId } = request.params;
    const deleteResponse = await this.service.deleteUserById(
      request.data,
      type as "department" | "program" | "subject",
      typeId,
      userId
    );
    if (typeof deleteResponse === "string")
      return this.send(next, false, deleteResponse, HttpStatus.FORBIDDEN);
    this.send(next, true, null, HttpStatus.NO_CONTENT);
  };
}
