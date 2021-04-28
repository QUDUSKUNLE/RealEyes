import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Application } from 'express';
import RealEyesRoutes from './routes';



export default class RealEyes {
  private readonly realEyesRoutes: RealEyesRoutes = new RealEyesRoutes();
  public readonly realEyes: Application;

  constructor() {
    this.realEyes = express();
    this.appConfiguration();
    this.realEyesRoutes .bindRoutes(this.realEyes);
  }

  private appConfiguration = (): void => {
    this.realEyes.use(bodyParser.json({ type: 'application/json' }));
    this.realEyes.use(express.urlencoded({ extended: false }));
    this.realEyes.use(express.json());
    this.realEyes.use(cors());
  }
}
