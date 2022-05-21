import { Headers } from "interfaces/payload.interface";
import { ObjectMapper } from "jackson-js";
import request from "request";
import { autoInjectable } from "tsyringe";
import { v1 } from "uuid";
import XLSX from "xlsx";
@autoInjectable()
export default class Utils {
  public getBearerFromHeader(header: Headers): string | null {
    try {
      const token = header.authorization?.split(" ")[1];
      return token ? token.trim() : null;
    } catch (e) {
      return null;
    }
  }
  public getUuid(): string {
    return v1();
  }
  public getObjectMapper() {
    return {
      map: new ObjectMapper(),
      features: { deserialization: { FAIL_ON_UNKNOWN_PROPERTIES: false } },
    };
  }
  public parseSheetToJson(
    files: Express.Multer.File[],
    fieldName: string
  ): any {
    const buffer = Object.values(files).find(
      (file) => file.fieldname === fieldName
    )?.buffer;
    if (!buffer) throw new Error(`Sheet with name "${fieldName}" not found`);
    const wb = XLSX.read(buffer, { type: "buffer" });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    return XLSX.utils.sheet_to_json(ws);
  }
  public getIp() {
    return new Promise((resolve) => {
      request.get("https://api.ipify.org", (err, resp, body) => {
        if (err) return resolve(null);
        resolve(body);
      });
    });
  }

  public isProduction(): boolean {
    return process.env.MODE === "PROD";
  }

  public timeExpired(timeStamp: number, time: number): boolean {
    return Math.floor((Date.now() - Number(time)) / 1000) > timeStamp;
  }

  public checkTwoArrays<T>(arr1: T[], arr2: T[]): boolean {
    return arr1.some((v) => arr2.includes(v));
  }

  public validateIfExpired(time: number, expiry: number): boolean {
    return (
      Math.floor((Date.now() - ((isNaN(time) && -Infinity) || time)) / 1000) >
      expiry
    );
  }
}
