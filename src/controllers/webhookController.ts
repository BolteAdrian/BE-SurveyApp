import { Request, Response } from "express";
import { webhookService } from "../services/webhookService";

/**
 * Controller for webhooks (SES)
 */
export const webhookController = {
  /**
   * Handle AWS SES bounce webhook
   * @route POST /webhooks/ses
   */
  sesWebhook: async (req: Request, res: Response) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "WEBHOOK.PAYLOAD_MISSING",
      });
    }

    try {
      await webhookService.handleSesBounce(req.body);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("SES webhook handling failed:", err);
      res.status(403).json({
        error: "WEBHOOK.SES_FAILED",
      });
    }
  },
};