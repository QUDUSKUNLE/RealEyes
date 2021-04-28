import { Application } from 'express';
import RealEyesController from '../controllers';


export default class RealEyesRoutes {
  public readonly realEyesController: RealEyesController;

  constructor() {
    this.realEyesController = new RealEyesController();
  }

  bindRoutes(realEyes: Application) {
    realEyes
      .route('/home')
      .get(this.realEyesController.realEyesHome);

    realEyes
      .route('/api/v1/info')
      .get(this.realEyesController.realEyesInfo);

    realEyes
      .route('/api/v1/metadata')
      .get(this.realEyesController.probeAsset);
  }
}
