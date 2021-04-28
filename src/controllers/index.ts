import { Request, Response } from 'express';
import { logger } from '../utils';

export default class RealEyesController {

  public realEyesHome = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    try {
      return await res.status(200).json({ RealEyes: 'Welcome to RealEyes home'})
    } catch (error) {
      logger.error(error);
      return res.status(400).json({ message: error.message })
    }
  }
}
