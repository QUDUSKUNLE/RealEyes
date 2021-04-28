import RealEyes from './server';
import { logger, environment } from './utils';

const realEyes = new RealEyes().realEyes

realEyes.listen(
  environment.PORT,
  () => logger.info(`RealEyes server running on port: ${environment.PORT}`)
);
