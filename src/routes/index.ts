import { Application } from 'express';

import RealEyesController from '../controllers';


/**
 * @class RealEyesRoutes handles RealEyes app routes
 */
export default class RealEyesRoutes {
  public readonly realEyesController: RealEyesController;

  constructor() {
    this.realEyesController = new RealEyesController();
  }

  /**
   * @method bindRoutes to RealEyesController
   * @param {Application} realEyes
   */
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

    realEyes
      .route('/api/v1/encode')
      .post(this.realEyesController.encodeAsset);
  }
}
