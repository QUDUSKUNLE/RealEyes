import path from 'path';
import { google } from 'googleapis';
import { Storage } from '@google-cloud/storage';
import { environment, googleCredentials } from '../utils';


export default class GoogleServices {
  public readonly drive: any;
  public readonly storage: any;
  public readonly bucketName: string;
  public readonly auth: any;

  constructor() {
    this.drive = google.drive({ version: 'v3' })
    this.storage = new Storage({
      ...googleCredentials,
      projectId: 'post-it-app'
    });
    this.bucketName = environment.BUCKET_NAME || 'bolubot-dpyxwo.appspot.com';
    this.auth = new google.auth.GoogleAuth({
      ...googleCredentials,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/drive.photos.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
      ]
    })
  }

  public copyFileToGoogle = async (
    filePath: string,
    options = {}
  ): Promise<void> => {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = path.basename(filePath);
      const file = bucket.file(fileName);
      await bucket.upload(filePath, options);
      await file.makePublic();
      return;
    } catch (error) {
      throw error;
    }
  }
}
