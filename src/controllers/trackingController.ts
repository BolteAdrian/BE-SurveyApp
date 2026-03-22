import { Request, Response } from "express";
import { trackingService } from "../services/trackingService";
import { pixel } from "../utils/constants";

/**
 * Controller for tracking events
 */
export const trackingController = {
  /**
   * Email open tracking pixel
   * @route GET /t/open/:token.png
   */
  emailOpenPixel: async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: "TRACKING.TOKEN_MISSING",
      });
    }

    try {
      await trackingService.markEmailOpened(token as string);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store");
      res.status(200).send(pixel);
    } catch (err) {
      console.error("Email open tracking failed:", err);
      res.status(403).json({
        error: "TRACKING.EMAIL_OPEN_FAILED",
      });
    }
  },
};
