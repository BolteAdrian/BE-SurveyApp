import { PrismaClient } from "@prisma/client";
import { SurveyStatus } from "../utils/constants";
const prisma = new PrismaClient();

/**
 * Service for handling Surveys.
 */
export const surveyService = {
  /**
   * Create a new survey in draft status.
   */
  createSurvey: async (title: string, description?: string, slug?: string, owner?: string) => {
    return prisma.survey.create({
      data: { 
        title, 
        description, 
        slug: slug as string, 
        status: SurveyStatus.Draft, 
        owner: {
          connect: { id: owner }
        }
      },
    });
  },

  /**
   * Update a survey (only if draft)
   */
  updateSurvey: async (
    id: string,
    data: { title?: string; description?: string },
  ) => {
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) throw new Error("Survey not found");
    if (survey.status !== SurveyStatus.Draft)
      throw new Error("Cannot edit a published/closed survey");
    return prisma.survey.update({ where: { id }, data });
  },

  /**
   * Add question to a survey (only if draft)
   */
  addQuestion: async (surveyId: string, questionData: any) => {
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey || survey.status !== SurveyStatus.Draft)
      throw new Error("Survey not editable");
    return prisma.question.create({
      data: { ...questionData, surveyId },
    });
  },

  /**
   * Update question (only if survey draft)
   */
  updateQuestion: async (
    surveyId: string,
    questionId: string,
    questionData: any,
  ) => {
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey || survey.status !== SurveyStatus.Draft)
      throw new Error("Survey not editable");
    return prisma.question.update({
      where: { id: questionId },
      data: questionData,
    });
  },

  /**
   * Publish a survey
   */
  publishSurvey: async (surveyId: string) => {
    const questionsCount = await prisma.question.count({ where: { surveyId } });
    if (questionsCount < 1)
      throw new Error("Survey must have at least one question");
    return prisma.survey.update({
      where: { id: surveyId },
      data: { status: SurveyStatus.Published },
    });
  },

  /**
   * Close a survey (irreversible)
   */
  closeSurvey: async (surveyId: string) => {
    return prisma.survey.update({
      where: { id: surveyId },
      data: { status: SurveyStatus.Closed },
    });
  },
};
