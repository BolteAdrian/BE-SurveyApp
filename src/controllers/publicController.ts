import { Request, Response } from "express";
import { publicService } from "../services/publicService";
import { trackingService } from "../services/trackingService";

/**
 * Controller for public survey access
 */
export const publicController = {
  /**
   * Get survey page
   * @route GET /s/:slug?t=token
   */
  getSurvey: async (req: Request, res: Response) => {
    const { slug } = req.params;
    const token = String(req.query.t || "");

    if (!slug) {
      return res.status(400).json({
        error: req.t("SURVEY.FETCH_FAILED"),
      });
    }

    try {
      const result = await publicService.getSurveyPage(slug as string, token);

      if (result.error) {
        return res.status(404).json({
          error: req.t("SURVEY.NOT_FOUND"),
          message: result.error,
        });
      }

      // mark survey opened (tracking)
      try {
        if (token) await trackingService.markSurveyOpened(token);
      } catch (trackingErr) {
        console.error("Tracking failed:", trackingErr);
      }

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({
        error: req.t("SURVEY.FETCH_FAILED"),
      });
    }
  },

  /**
   * Submit survey response
   * @route POST /api/public/surveys/:slug/responses?t=token
   */
  submitResponse: async (req: Request, res: Response) => {
    const { slug } = req.params;
    const token = String(req.query.t || "");
    const answers = req.body.answers;

    if (!slug || !answers) {
      return res.status(400).json({
        error: req.t("SURVEY.RESPONSE_SUBMIT_FAILED"),
      });
    }

    try {
      const result = await publicService.submitResponse(
        slug as string,
        token,
        answers,
      );

      if (!result.success) {
        return res.status(400).json({
          error: req.t("SURVEY.RESPONSE_SUBMIT_FAILED"),
        });
      }

      res.status(201).json(result); // Created
    } catch (err: any) {
      console.error(err);
      if (err.status === 410) {
        return res.status(410).json({
          error: req.t("SURVEY.CLOSED"),
        });
      }
      if (err.message === "ALREADY_SUBMITTED") {
        return res.status(409).json({
          message: "ALREADY_SUBMITTED",
        });
      }
      res.status(400).json({
        error: req.t("SURVEY.RESPONSE_SUBMIT_FAILED"),
        message: err.message,
      });
    }
  },
};
