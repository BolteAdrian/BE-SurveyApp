import { Request, Response } from "express";
import { resultService } from "../services/resultService";

/**
 * Controller for survey results (admin)
 */
export const resultController = {
  /**
   * Get summary funnel: invited → sent → email opened → survey opened → submitted → bounced
   * @route GET /surveys/:id/results/summary
   */
  getSummary: async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: req.t("RESULT.SUMMARY_FETCH_FAILED"),
      });
    }

    try {
      const summary = await resultService.getSummary(id as string);
      res.status(200).json(summary);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("RESULT.SUMMARY_FETCH_FAILED"),
      });
    }
  },

  /**
   * Get question statistics: count + % per option
   * @route GET /surveys/:id/results/questions
   */
  getQuestionStats: async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: req.t("RESULT.QUESTION_STATS_FETCH_FAILED"),
      });
    }

    try {
      const stats = await resultService.getQuestionStats(id as string);
      res.status(200).json(stats);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("RESULT.QUESTION_STATS_FETCH_FAILED"),
      });
    }
  },

  /**
   * Get text comments with pagination and optional question filter
   * @route GET /surveys/:id/results/comments?q=&page=&question_id=
   */
  getComments: async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const q = String(req.query.q || "");
    const questionId = req.query.question_id ? String(req.query.question_id) : undefined;

    if (!id) {
      return res.status(400).json({
        error: req.t("RESULT.COMMENTS_FETCH_FAILED"),
      });
    }

    try {
      const comments = await resultService.getComments(id as string, page, q, questionId);
      res.status(200).json(comments);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("RESULT.COMMENTS_FETCH_FAILED"),
      });
    }
  },

  /**
   * Export all survey responses as CSV
   * @route GET /surveys/:id/results/export.csv
   */
  exportCsv: async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: req.t("RESULT.EXPORT_FAILED"),
      });
    }

    try {
      // Implement CSV export logic in the service
      const csvData = await resultService.exportCsv(id as string);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="survey_${id}_results.csv"`
      );
      res.status(200).send(csvData);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("RESULT.EXPORT_FAILED"),
      });
    }
  },
};