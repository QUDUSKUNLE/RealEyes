import { Application } from 'express';
import RealEyesController from '../controllers';


export default class RealEyesRoutes {
  public readonly realEyesController: RealEyesController;

  constructor() {
    this.realEyesController = new RealEyesController();
  }

  bindRoutes(app: Application) {
    app
      .route('/home')
      .get(this.realEyesController.realEyesHome);
  }
}
