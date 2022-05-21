import Firebase from ".";
export default class FirebaseStorage extends Firebase {
  public uploadFile(reference: string, file: any): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const blobWriter = this.getStorage()
          .bucket()
          .file(`${reference}/${file.originalname}`)
          .createWriteStream({ metadata: { contentType: file.mimetype } });
        blobWriter.on("error", () => reject("Failed to upload file"));
        blobWriter.on("finish", resolve);
        blobWriter.end(file.buffer);
      } catch (e) {
        reject(e);
      }
    });
  }

  public getFile(reference: string): Promise<any | false> {
    return new Promise(async (resolve, reject) => {
      try {
        this.getStorage()
          .bucket()
          .getFiles({ directory: reference }, (err, files: any[]) =>
            resolve(err || !files[0] ? false : files[0])
          );
      } catch (e) {
        reject(e);
      }
    });
  }

  public deleteFile(reference): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(
          await this.getStorage().bucket().deleteFiles({ directory: reference })
        );
      } catch (e) {
        reject(e);
      }
    });
  }
}
