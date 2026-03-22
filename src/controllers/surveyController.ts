import { Request, Response } from "express";
import { surveyService } from "../services/surveyService";
import { SurveyStatus } from "../utils/constants";

/**
 * Controller for survey admin routes
 */
export const surveyController = {
  /**
   * Create a new survey
   * @route POST /surveys
   */
  createSurvey: async (req: Request, res: Response) => {
    const { title, description, slug, ownerId, questions } = req.body;
    if (!title || !slug || !ownerId || !questions || questions.length === 0) {
      return res.status(400).json({
        error: req.t("SURVEY.CREATE_FAILED"),
      });
    }
    try {
      const survey = await surveyService.createSurvey(
        title,
        slug,
        ownerId,
        questions,
        description,
      );
      res.status(201).json(survey); // Created
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.CREATE_FAILED"),
      });
    }
  },

  /**
   * Update an existing survey
   * @route PUT /surveys/:id
   */
  updateSurvey: async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        error: req.t("SURVEY.UPDATE_FAILED"),
      });

    try {
      const survey = await surveyService.updateSurvey(id as string, req.body);
      res.status(200).json(survey); // OK
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.UPDATE_FAILED"),
      });
    }
  },

  /**
   * Delete a survey
   * @route DELETE /surveys/:id
   */
  deleteSurvey: async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        error: req.t("SURVEY.DELETE_FAILED"),
      });

    try {
      await surveyService.deleteSurvey(id as string);
      res.status(200).json({
        message: req.t("SURVEY.DELETED"),
      });
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.DELETE_FAILED"),
      });
    }
  },

  /**
   * Get a specific question from a survey
   * @route GET /surveys/:id/questions/:qid
   */
  getQuestion: async (req: Request, res: Response) => {
    const { id, qid } = req.params;
    if (!id || !qid)
      return res.status(400).json({
        error: req.t("SURVEY.QUESTION_FETCH_FAILED"),
      });

    try {
      const question = await surveyService.getQuestion(
        id as string,
        qid as string,
      );
      if (!question)
        return res.status(404).json({
          error: req.t("SURVEY.QUESTION_NOT_FOUND"),
        });
      res.status(200).json(question);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.QUESTION_FETCH_FAILED"),
      });
    }
  },

  /**
   * Add a question to a survey
   * @route POST /surveys/:id/questions
   */
  addQuestion: async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        error: req.t("SURVEY.QUESTION_ADD_FAILED"),
      });

    try {
      const question = await surveyService.addQuestion(id as string, req.body);
      res.status(201).json(question);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.QUESTION_ADD_FAILED"),
      });
    }
  },

  /**
   * Update a specific question
   * @route PUT /surveys/:id/questions/:qid
   */
  updateQuestion: async (req: Request, res: Response) => {
    const { id, qid } = req.params;
    if (!id || !qid)
      return res.status(400).json({
        error: req.t("SURVEY.QUESTION_UPDATE_FAILED"),
      });

    try {
      const question = await surveyService.updateQuestion(
        id as string,
        qid as string,
        req.body,
      );
      res.status(200).json(question);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.QUESTION_UPDATE_FAILED"),
      });
    }
  },

  /**
   * Publish a survey
   * @route POST /surveys/:id/publish
   */
  publishSurvey: async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        error: req.t("SURVEY.PUBLISH_FAILED"),
      });

    try {
      const survey = await surveyService.publishSurvey(id as string);
      res.status(200).json(survey);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.PUBLISH_FAILED"),
      });
    }
  },

  /**
   * Close a survey
   * @route POST /surveys/:id/close
   */
  closeSurvey: async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        error: req.t("SURVEY.CLOSE_FAILED"),
      });

    try {
      const survey = await surveyService.closeSurvey(id as string);
      res.status(200).json(survey);
    } catch (err) {
      console.error(err);
      res.status(403).json({ error: req.t("SURVEY.CLOSE_FAILED") });
    }
  },

  /**
   * Get surveys filtered by status
   * @route GET /surveys?status=STATUS
   */
  getSurveys: async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const validStatus =
        typeof status === "string" ? status.toUpperCase() : undefined;
      const surveyStatus =
        validStatus && Object.values<string>(SurveyStatus).includes(validStatus)
          ? (validStatus as SurveyStatus)
          : undefined;

      const surveys = await surveyService.getSurveys(surveyStatus);
      res.status(200).json(surveys);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.FETCH_FAILED"),
      });
    }
  },

  /**
   * Get a specific survey
   * @route GET /surveys/:id
   */
  getSurvey: async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        error: req.t("SURVEY.FETCH_FAILED"),
      });

    try {
      const survey = await surveyService.getSurvey(id as string);
      if (!survey)
        return res.status(404).json({
          error: req.t("SURVEY.NOT_FOUND"),
        });
      res.status(200).json(survey);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.FETCH_FAILED"),
      });
    }
  },

  /**
   * Delete a question from a survey
   * @route DELETE /surveys/:id/questions/:qid
   */
  deleteQuestion: async (req: Request, res: Response) => {
    const { id, qid } = req.params;
    if (!id || !qid)
      return res.status(400).json({
        error: req.t("SURVEY.QUESTION_DELETE_FAILED"),
      });

    try {
      await surveyService.deleteQuestion(id as string, qid as string);
      res.status(200).json({
        message: req.t("SURVEY.QUESTION_DELETED"),
      });
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("SURVEY.QUESTION_DELETE_FAILED"),
      });
    }
  },
};
