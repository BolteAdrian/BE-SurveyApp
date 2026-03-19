import { Request, Response } from 'express';
import { webhookService } from '../services/webhookService';

/**
 * Controller for webhooks (SES)
 */
export const webhookController = {
  /**
   * Handle AWS SES bounce webhook
   * POST /webhooks/ses
   */
  sesWebhook: async (req: Request, res: Response) => {
    await webhookService.handleSesBounce(req.body);
    res.json({ success: true });
  },
};