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
    const token = String(req.query.t || '');

    const result = await publicService.getSurveyPage(slug as string, token);

    if (result.error) {
      return res.status(200).json({ message: result.error });
    }

    // mark survey opened
    await trackingService.markSurveyOpened(token);

    res.json(result);
  },

  /**
   * Submit survey response
   * POST /api/public/surveys/:slug/responses?t=token
   */
  submitResponse: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const token = String(req.query.t || '');

      const response = await publicService.submitResponse(
        slug as string,
        token,
        req.body.answers
      );

      res.json(response);
    } catch (err: any) {
      if (err.status === 410) {
        return res.status(410).json({ error: 'SURVEY_CLOSED' });
      }

      res.status(400).json({ error: err.message });
    }
  },
};