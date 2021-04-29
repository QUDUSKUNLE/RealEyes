import RealEyes from './server';
import { logger, environment } from './utils';


const realEyes = new RealEyes().realEyes

// RealEyes server
realEyes.listen(
  environment.PORT,
  () => logger.info(`RealEyes server running on port: ${environment.PORT}`)
);
