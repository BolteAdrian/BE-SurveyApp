import { Request, Response } from 'express';
import { surveyService } from '../services/surveyService';

/**
 * Controller for survey admin routes
 */
export const surveyController = {
  createSurvey: async (req: Request, res: Response) => {
    const { title, description, slug } = req.body;
    const survey = await surveyService.createSurvey(title, description, slug);
    res.json(survey);
  },

  updateSurvey: async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    const survey = await surveyService.updateSurvey(id as string, data);
    res.json(survey);
  },

  addQuestion: async (req: Request, res: Response) => {
    const { id } = req.params;
    const question = await surveyService.addQuestion(id  as string, req.body);
    res.json(question);
  },

  updateQuestion: async (req: Request, res: Response) => {
    const { id, qid } = req.params;
    const question = await surveyService.updateQuestion(id as string, qid as string, req.body);
    res.json(question);
  },

  publishSurvey: async (req: Request, res: Response) => {
    const { id } = req.params;
    const survey = await surveyService.publishSurvey(id as string);
    res.json(survey);
  },

  closeSurvey: async (req: Request, res: Response) => {
    const { id } = req.params;
    const survey = await surveyService.closeSurvey(id as string);
    res.json(survey);
  },
};