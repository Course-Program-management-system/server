import firebase from "firebase";
import "firebase/storage";
import { Bucket } from "@google-cloud/storage";
import admin, { storage } from "firebase-admin";
export default class Firebase {
  protected static firebaseStorage: storage.Storage;
  public initializeFirebase() {
    Firebase.firebaseStorage = admin
      .initializeApp({
        storageBucket: process.env.storageBucket,
        credential: admin.credential.cert("./config/serviceAccount.json"),
      })
      .storage();
  }

  protected getStorage(): storage.Storage {
    return Firebase.firebaseStorage;
  }
}
