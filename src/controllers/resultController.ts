import { Request, Response } from 'express';
import { resultService } from '../services/resultService';

/**
 * Controller for survey results (admin)
 */
export const resultController = {
  /**
   * Get summary funnel: invited → sent → email opened → survey opened → submitted → bounced
   * GET /api/surveys/:id/results/summary
   */
  getSummary: async (req: Request, res: Response) => {
    const { id } = req.params;
    const summary = await resultService.getSummary(id as string);
    res.json(summary);
  },

  /**
   * Get question statistics: count + % per option
   * GET /api/surveys/:id/results/questions
   */
  getQuestionStats: async (req: Request, res: Response) => {
    const { id } = req.params;
    const stats = await resultService.getQuestionStats(id as string);
    res.json(stats);
  },

  /**
   * Get text comments with pagination and optional question filter
   * GET /api/surveys/:id/results/comments?q=&page=&question_id=
   */
  getComments: async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const q = String(req.query.q || '');
    const questionId = req.query.question_id ? String(req.query.question_id) : undefined;
    const comments = await resultService.getComments(id as string, page, q, questionId);
    res.json(comments);
  },

  /**
   * Export all survey responses as CSV
   * GET /api/surveys/:id/results/export.csv
   */
  exportCsv: async (req: Request, res: Response) => {
    const { id } = req.params;
    // Placeholder: implement CSV export logic
    res.setHeader('Content-Type', 'text/csv');
    res.send('email,submitted_at,...\n'); // example
  },
};