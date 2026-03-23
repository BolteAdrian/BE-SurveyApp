import { Request, Response } from "express";
import { webhookService } from "../services/webhookService";

export const webhookController = {
  /**
   * Handle AWS SES bounce webhook
   */
  sesWebhook: async (req: Request, res: Response) => {
    let payload = req.body;

    // SNS sometimes sends the payload as a stringified JSON
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        return res.status(400).json({ error: "INVALID_JSON" });
      }
    }

    // Handle AWS SNS Subscription Confirmation (needed once to verify the URL)
    if (payload.Type === "SubscriptionConfirmation") {
      console.log("SNS Subscription URL:", payload.SubscribeURL);
      return res.status(200).send("OK");
    }

    try {
      // SES structure is usually wrapped in a 'Message' if coming from SNS
      const message = payload.Message ? JSON.parse(payload.Message) : payload;
      
      if (message.notificationType === "Bounce") {
        await webhookService.handleSesBounce(message);
      } else if (message.notificationType === "Complaint") {
        await webhookService.handleSesComplaint(message);
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("SES webhook handling failed:", err);
      res.status(200).json({ success: false }); // We return 200 to AWS to stop retries
    }
  },
};