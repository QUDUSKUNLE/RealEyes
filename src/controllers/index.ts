import ffprobe from 'ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import  {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors
}  from 'unique-names-generator';

import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { Request, Response } from 'express';

import { logger, appInfo } from '../utils';
import GoogleServices from '../services';


export default class RealEyesController extends GoogleServices {
  constructor() {
    super()
  }

  private uniqueName = async (): Promise<string> => {
    const customConfig: Config = {
      dictionaries: [adjectives, colors],
      separator: '-',
      length: 2,
    };
    return await uniqueNamesGenerator(customConfig);
  }

  private downloadFile = async (
    fileId: string,
    filename: string = 'video',
    extension: string = 'mp4'
  ): Promise<string> => {
    const filePath = `./uploads/${filename}.${extension}`;
    const dest = fs.createWriteStream(filePath);
    google.options({ auth: this.auth });
    return this.drive.files
      .get({ fileId, alt: 'media' }, { responseType: 'stream'})
      .then((res: any) =>
        new Promise((resolve: any, reject: any) => {
          let progress: number = 0;
          res.data
            .on('end', () => {
              resolve(filePath);
            })
            .on('error', (err: any) => {
              reject(err)
            })
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
    let filename: string = '';
    try {
      filename = await this.uniqueName();
      switch (url && url.hostname) {
        case 'drive.google.com':
          result = await this.downloadFile(
            url.pathname.split('/')[3],
            filename
          );
          break;
      };
      result = path.resolve(__dirname, `../../uploads/${filename}.mp4`);
      const assetMetadata = await ffprobe(result, { path: ffprobeStatic.path });
      await fs.unlinkSync(result);
      return await res.status(200).json({ assetMetadata });
    } catch (err) {
      logger.error(err.message);
      return res.status(400).json({ message: err.message });
    }
  }

  public encodeAsset = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    if (!req.body.url) {
      return res.status(400).json({ message: 'Downloadable asset url is required'})
    }
    if (!req.body.videoBitrate) {
      return res.status(400).json({ message: 'VideoBitrate is required' });
    }
    const url  = new URL(req.body.url);
    let result: string = '';
    let filename: string = '';
    if (!req.body.videoCodec) req.body.videoCodec = 'libx264'
    try {
      filename = await this.uniqueName();
      switch (url && url.hostname) {
        case 'drive.google.com':
          result = await this.downloadFile(
            url.pathname.split('/')[3],
            filename
          );
          break;
      };
      result = path.resolve(__dirname, `../../uploads/${filename}.mp4`);
      await ffmpeg(result)
        .videoBitrate(req.body.videoBitrate)
        .videoCodec(req.body.videoCodec)
        .output(result);
      await this.copyFileToGoogle(result)
      return res.status(201).json({ message: 'File uploaded to google' });
    } catch (error) {
      logger.error(error.message);
      return res.status(400).json({ message: error.message })
    }
  }

  public uploadGoogleCloud = async (req: Request, res: Response) => {
    try {
      return await res.status(200).json({ message: true })
    } catch (error) {
      logger.error(error.message);
      return res.status(400).json({ error: error.message });
    }
  }
}
