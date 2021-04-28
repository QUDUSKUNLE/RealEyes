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


export {
  logger,
  environment,
};
