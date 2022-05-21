import { Router } from "common/services";
import express, { Application, NextFunction, Request, Response } from "express";
import { CustomRouter } from "interfaces";
import path from "path";
import { autoInjectable } from "tsyringe";
@autoInjectable()
export default class ViewMiddleware extends Router implements CustomRouter {
  constructor() {
    super();
    this.initializeRouter();
  }
  public initializeRouter() {
    this.serviceApp.use(express.static(path.join(__dirname, "..", "view")));
    this.serviceApp.get(
      "/",
      async (req: Request, res: Response, next: NextFunction) => {
        res.sendFile(path.join(__dirname, "..", "view", "index.html"));
      }
    );
  }
  public getRouter(): Application {
    return this.serviceApp;
  }
}
