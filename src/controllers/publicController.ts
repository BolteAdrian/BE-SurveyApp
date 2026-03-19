import { Request, Response } from 'express';
import { publicService } from '../services/publicService';
import { trackingService } from '../services/trackingService';

/**
 * Controller for public survey access
 */
export const publicController = {
  /**
   * Get survey page
   * GET /s/:slug?t=token
   */
  getSurvey: async (req: Request, res: Response) => {
    const { slug } = req.params;
    const token = String(req.query.t || "");

    try {
      const result = await publicService.getSurveyPage(slug as string, token);

      if (result.error) return res.status(200).json({ message: result.error });

      // mark survey opened
      await trackingService.markSurveyOpened(token);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * Submit survey response
   * POST /api/public/surveys/:slug/responses?t=token
   */
  submitResponse: async (req: Request, res: Response) => {
    const { slug } = req.params;
    const token = String(req.query.t || "");
    const answers = req.body.answers;

    try {
      const result = await publicService.submitResponse(
        slug as string,
        token,
        answers,
      );

      if (result.error) return res.status(400).json(result);

      res.json(result);
    } catch (err: any) {
      if (err.status === 410)
        return res.status(410).json({ error: "SURVEY_CLOSED" });
      res.status(400).json({ error: err.message });
    }
  },
};
