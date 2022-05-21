import { ObjectId } from "mongodb";
import { createConnection, getMongoManager, MongoEntityManager } from "typeorm";
export default class Repository {
  private static manager: MongoEntityManager;
  private readonly connectionDetails: any = {
    type: "mongodb",
    useUnifiedTopology: true,
    useNewUrlParser: true,
    entities: [__dirname + "/entity/**/*.{js,ts}"],
    subscribers: [__dirname + "/subscriber/**/*.{js,ts}"],
  };
  public getManager(): MongoEntityManager {
    return getMongoManager();
  }
  public getEntityManager(): MongoEntityManager {
    return Repository.manager;
  }
  public setId(id: string) {
    return `${id}`.length !== 24 ? id : ObjectId(`${id}`);
  }
  protected static initializeManager() {
    this.manager = getMongoManager();
  }
  protected createConnection() {
    return createConnection(
      process.env.DATABASE_URL
        ? {
            url: process.env.DATABASE_URL,
            synchronize: true,
            logging: true,
            ssl: true,
            authSource: "admin",
            ...this.connectionDetails,
          }
        : {
            host: "mongo:27017",
            port: 27017,
            ...this.connectionDetails,
          }
    );
  }
}
