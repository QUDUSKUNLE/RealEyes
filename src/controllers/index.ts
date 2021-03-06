import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import { createWriteStream, unlinkSync } from 'fs';
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
  private downloadAsset = async (
    asset: string,
    extension: string = 'mp4'
  ): Promise<string> => {
    const url  = new URL(asset);
    let result: string = ''
    const filename = await this.uniqueName();
    switch (url && url.hostname) {
      case 'drive.google.com':
        const fileId = url.pathname.split('/')[3];
        const filePath = path.join(os.tmpdir(), `/${filename}.${extension}`);
        const destination = createWriteStream(filePath);
        google.options({ auth: this.auth });
        result = this.drive.files
          .get({ fileId, alt: 'media' }, { responseType: 'stream'})
          .then((res: any) =>
            new Promise((resolve: any, reject: any) => {
              let progress: number = 0;
              res.data
                .on('end', () => resolve(filePath))
                .on('error', (err: any) => reject(new Error(err)))
                .on('data', (data: any) => {
                  progress += data.length;
                  if (process.stdout.isTTY) {
                    process.stdout.cursorTo(0);
                    process.stdout.write(`Downloaded ${progress} bytes`);
                  }
                })
                .pipe(destination)
            }))
        break;
      default:
        break;
    };
    return result;
  }

  /**
   * @param  {string} filePath
   * @returns Promise
   */
  private probeFile = (
    filePath: string
  ): Promise<{}> =>
    new Promise((
      resolve: any,
      reject: any
    ) => {
      ffmpeg.ffprobe(
        filePath,
        (err: any, metadata: {}) => {
          if (err) reject(new Error(err));
          resolve(metadata);
        }
      );
  })

  /**
   * @param  {string} filePath
   * @param  {string} newFilePath
   * @param  {string} videoBitrate
   * @param  {string} videoCodec
   * @returns Promise
   */
  private encodeFile = (
    filePath: string,
    newFilePath: string,
    videoBitrate: string,
    videoCodec: string
  ): Promise<string> =>
    new Promise((
      resolve: any,
      reject: any
    ) => {
      ffmpeg(filePath)
        .videoBitrate(videoBitrate)
        .videoCodec(videoCodec)
        .on('error', (err: any) => reject(new Error(err)))
        .save(newFilePath)
        .on('end', () => resolve('done'));
  });

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
      return res.status(500).json({ message: error.message })
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
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * @param  {Request} req
   * @param  {Response} res
   * @returns Promise
   */
  public probeAsset = async (
    req: Request,
    res: Response
  ): Promise<object> => {
    const { asset } = req.query;
    if (!asset) {
      return res.status(400).json({ message: 'Asset link is required' });
    }
    if (typeof asset !== 'string') {
      return res.status(400).json({ message: 'Invalid query asset' });
    }
    try {
      await new URL(asset);
      const filePath = await this.downloadAsset(asset);
      const metadata = await this.probeFile(filePath);
      unlinkSync(filePath);
      return res.status(200).json({ metadata });
    } catch (err) {
      logger.error(err.message);
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * @param  {Request} req
   * @param  {Response} res
   * @returns Promise
   */
  public encodeAsset = async (
    req: Request,
    res: Response
  ): Promise<object> => {
    if (!req.body.url) {
      return res.status(400).json({ message: 'Downloadable asset url is required' });
    }
    if (!req.body.videoBitrate) {
      return res.status(400).json({ message: 'VideoBitrate is required' });
    }
    if (!req.body.videoCodec) req.body.videoCodec = 'libx264';
    const { videoCodec, videoBitrate } = req.body;
    try {
      await new URL(req.body.url);
      const result = await this.downloadAsset(req.body.url);
      const newFilePath = path.join(os.tmpdir(), `/${this.uniqueName()}.avi`);
      await this.encodeFile(result, newFilePath, videoBitrate, videoCodec);
      this.copyFileToGoogle(newFilePath);
      const assetMetadata = await this.probeFile(newFilePath);
      unlinkSync(newFilePath);
      unlinkSync(result);
      return res.status(200).json({ message: 'File uploaded to google', assetMetadata });
    } catch (error) {
      logger.error(error.message);
      return res.status(500).json({ message: error.message });
    }
  }
}
