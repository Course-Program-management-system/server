import bodyparser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import http from "http";
import IpWhitelistMiddleware from "middlewares/ip-whitelist.middleware";
import ResponseHandlerMiddleware from "middlewares/response-handler.middleware";
import UncaughtHandlerMiddleware from "middlewares/uncaught-handler.middleware";
import ViewMiddleware from "middlewares/view.middleware";
import "reflect-metadata";
import Repository from "repository";
import { autoInjectable, container } from "tsyringe";
import Utils from "utils";
// import Firebase from "utils/firebase";
import Service from "./services";
@autoInjectable()
export default class Server extends Repository {
  private application: express.Application;
  private port: number | string;
  constructor(
    // private firebase: Firebase,
    private responseHandlerMiddleware: ResponseHandlerMiddleware,
    private uncaughtHandlerMiddleware: UncaughtHandlerMiddleware,
    private ipWhitelistMiddleware: IpWhitelistMiddleware,
    private utils: Utils,
    private viewMiddleware: ViewMiddleware
  ) {
    super();
    this.application = express();
    this.port = process.env.PORT || 8080;
    this.initalizeMiddlewares();
    dotenv.config();
  }

  private initalizeMiddlewares() {
    this.application.use(this.uncaughtHandlerMiddleware.catch);
    this.application.use(cors({ origin: "*" }));
    this.application.use(helmet({ contentSecurityPolicy: true }));
    this.application.use(bodyparser.json());
    this.application.use(express.json());
    // this.application.use(this.ipWhitelistMiddleware.getRouter());
    // this.application.use(this.ipWhitelistMiddleware.CheckIp);
    if (this.utils.isProduction()) {
      this.application.use(this.viewMiddleware.getRouter());
    }
    this.application.use(container.resolve(Service).getRouter());
    this.application.use(this.responseHandlerMiddleware.get);
  }

  public start(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Environment ${process.env.MODE}`);
        // this.firebase.initializeFirebase();
        await this.createConnection();
        Repository.initializeManager();
        const server: http.Server = this.application.listen(
          Number(this.port),
          "0.0.0.0",
          () => {
            resolve("Running on port " + this.port);
          }
        );
        server.on("error", (e) => {
          reject(`Server failed to start on port ${this.port}`);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
