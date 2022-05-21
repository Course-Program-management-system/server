import cluster from "cluster";
import os from "os";
import "reflect-metadata";
import { container } from "tsyringe";
import Server from "./server";
if (cluster.isPrimary) {
  container.resolve(Server).start().then(console.info).catch(console.error);
  for (let i = 0; i < os.cpus.length; i++) {
    cluster.fork();
  }
} else {
  container.resolve(Server).start().then(console.info).catch(console.error);
}
