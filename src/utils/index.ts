import bunyan from 'bunyan';
import dotenv from 'dotenv';
const PrettyStream = require('bunyan-pretty-stream');


dotenv.config();

const environment = process.env;
const logger = bunyan.createLogger({
  name: environment.APPNAME || 'RealEyes',
  streams: [
    {
      level: 'info',
      stream: new PrettyStream({}),
    }
  ],
});

const appInfo = {
  name: 'A complete, cross-platform solution to record, convert and stream audio and video',
  version: 'v1.0',
  description: '',
  routes: [
    {
      name: 'Api-information',
      description: 'This is the information about the API',
      method: 'GET',
      uri: 'api/v1/info',
    },
    {
      name: 'ProbeAsset',
      description: 'The API performs ffprobe job on an asset and returns a corresponding output',
      method: 'GET',
      uri: 'api/v1/metadata?asset=<downlodable-asset-url>',
    },
    {
      name: 'EncodeAsset',
      description: 'The API performs encoding job on an asset and returns a corresponding output',
      method: 'POST',
      uri: 'api/v1/encode',
      body: {
        url: 'Downloadbale asset url',
        videoBitrate: 'Output asset bitrate value',
        videoCodec: 'Output asset codec value or default=aac'
      }
    }
  ]
}


export {
  logger,
  environment,
  appInfo,
};
