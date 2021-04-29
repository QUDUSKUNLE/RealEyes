import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';
import path from 'path';
import ffprobe from 'ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import  {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors
}  from 'unique-names-generator';
import { google } from 'googleapis';
import { Request, Response } from 'express';

import { logger, appInfo } from '../utils';
import GoogleServices from '../services';



/**
 * @class RealEyesController extends GoogleServices
 */
export default class RealEyesController extends GoogleServices {
  private readonly customConfig: Config;
  constructor() {
    super();
    this.customConfig = {
      dictionaries: [adjectives, colors],
      separator: '-',
      length: 2,
    };
  }

  /**
   * @returns string
   */
  private uniqueName = (): string => uniqueNamesGenerator(this.customConfig);

  /**
   * @param  {string} fileId
   * @param  {string='video'} filename
   * @param  {string='mp4'} extension
   * @returns Promise
   */
  private downloadFile = async (
    fileId: string,
    filename: string = 'video',
    extension: string = 'mp4'
  ): Promise<string> => {

    // Path that holds downloaded file
    const filePath = path.join(os.tmpdir(), `/${filename}.${extension}`);
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
  /**
   * @param  {Request} req
   * @param  {Response} res
   * @returns Promise
   */
  public realEyesHome = async (
    req: Request,
    res: Response
  ): Promise<object> => {
    try {
      return await res.status(200).json(
        { RealEyes: 'Welcome to RealEyes home'}
      )
    } catch (error) {
      logger.error(error.message);
      return res.status(400).json({ message: error.message })
    }
  }

  /**
   * @param  {Request} req
   * @param  {Response} res
   * @returns Promise
   */
  public realEyesInfo = async (
    req: Request,
    res: Response
  ): Promise<object> => {
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
      return res.status(400).json({ message: 'Invalid query asset' });
    }
    const url  = new URL(asset);
    let result: string = '';
    try {
      const filename = await this.uniqueName();
      switch (url && url.hostname) {
        case 'drive.google.com':
          result = await this.downloadFile(
            url.pathname.split('/')[3],
            filename
          );
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

  public encodeAsset = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    if (!req.body.url) {
      return res.status(400).json({ message: 'Downloadable asset url is required' });
    }
    if (!req.body.videoBitrate) {
      return res.status(400).json({ message: 'VideoBitrate is required' });
    }
    const url  = new URL(req.body.url);
    let result: string = '';
    if (!req.body.videoCodec) req.body.videoCodec = 'libx264';
    try {
      const filename = await this.uniqueName();
      switch (url && url.hostname) {
        case 'drive.google.com':
          result = await this.downloadFile(
            url.pathname.split('/')[3],
            filename
          );
          break;
      };
      const newFilePath = path.join(os.tmpdir(), `/${this.uniqueName()}.avi`);
      await new Promise((resolve: any, reject: any) => {
        ffmpeg(result)
          .videoBitrate(req.body.videoBitrate)
          .videoCodec(req.body.videoCodec)
          .on('error', (err: any) => reject(err))
          .save(newFilePath)
          .on('end', () => resolve('done'));
      });
      this.copyFileToGoogle(newFilePath);
      const assetMetadata = await ffprobe(newFilePath, { path: ffprobeStatic.path });
      await fs.unlinkSync(newFilePath);
      await fs.unlinkSync(result);
      return res.status(201).json({ message: 'File uploaded to google', assetMetadata });
    } catch (error) {
      logger.error(error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
