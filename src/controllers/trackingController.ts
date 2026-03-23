import { Request, Response } from "express";
import { trackingService } from "../services/trackingService";
import { pixel } from "../utils/constants";
import { hashToken } from "../utils/token";

export const trackingController = {
  /**
   * Email open tracking pixel
   * Handles both :token and :token.png
   */
  emailOpenPixel: async (req: Request, res: Response) => {
    let { token } = req.params;

    if (!token) {
      // Even if tracking fails, we usually return the pixel
      // to avoid broken images in the email client
      return res.setHeader("Content-Type", "image/png").send(pixel);
    }

    // Clean up .png extension if present in the param
    const rawToken = (token as string).replace(".png", "");
    const tokenHash = hashToken(rawToken);
    try {
      await trackingService.markEmailOpened(tokenHash);
      // Standard headers for tracking pixels
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      return res.status(200).send(pixel);
    } catch (err) {
      console.error("Email open tracking failed:", err);
      // Return pixel anyway so the user doesn't see a "broken" image icon
      return res.setHeader("Content-Type", "image/png").send(pixel);
    }
  },
};
