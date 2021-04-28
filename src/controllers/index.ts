import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { uuid } from 'uuidv4';
import { google } from 'googleapis';
import { Request, Response } from 'express';

import { logger, appInfo } from '../utils';



export default class RealEyesController {
  private readonly drive: any;

  constructor() {
    this.drive = google.drive({ version: 'v3' })
  }

  private downloadFile = async (fileId: string): Promise<string> => {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../credentials/credentials.json'),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/drive.photos.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
      ]
    });
    google.options({ auth });
    return this.drive.files
      .get({ fileId, alt: 'media' }, { responseType: 'stream'})
      .then((res: any) =>
        new Promise((resolve: any, reject: any) => {
          const filePath = path.join(os.tmpdir(), uuid());
          const dest = fs.createWriteStream(filePath);
          let progress: number = 0;
          res.data
            .on('end', () => resolve(filePath))
            .on('error', (err: any) => reject(err))
            .on('data', (data: any) => {
              progress += data.length;
              if (process.stdout.isTTY) {
                process.stdout.cursorTo(0);
                process.stdout.write(`Downloaded ${progress} bytes`);
              }
            })
            .pipe(dest);
        }))
  }

  public realEyesHome = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    try {
      return await res.status(200).json({ RealEyes: 'Welcome to RealEyes home'})
    } catch (error) {
      logger.error(error.message);
      return res.status(400).json({ message: error.message })
    }
  }

  public realEyesInfo = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    try {
      return await res.status(200).json({ realEyesApp: appInfo });
    } catch (error) {
      logger.error(error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  public probeAsset = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    const { asset } = req.query;
    if (!asset) {
      return res.status(400).json({ message: 'Asset link is required' });
    }
    if (typeof asset !== 'string') {
      return res.status(400).json({ message: 'Invalid query asset' })
    }
    const url  = new URL(asset);
    let result: string = '';
    try {
      switch (url && url.hostname) {
        case 'drive.google.com':
          result = await this.downloadFile(url.pathname.split('/')[3]);
          break;
      };
      const assetMetadata = await ffprobe(result, { path: ffprobeStatic.path });
      await fs.unlinkSync(result);
      return await res.status(200).json({ assetMetadata });
    } catch (err) {
      logger.error(err.message);
      return res.status(400).json({ message: err.message });
    }
  }
}
