import { Request, Response } from "express";
import { trackingService } from "../services/trackingService";
import { pixel } from "../utils/constants";

/**
 * Controller for tracking events
 */
export const trackingController = {
  /**
   * Email open tracking pixel
   * GET /t/open/:token.png
   */
  emailOpenPixel: async (req: Request, res: Response) => {
    const token = req.params.token;

    await trackingService.markEmailOpened(token as string);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(pixel);
  },
};
