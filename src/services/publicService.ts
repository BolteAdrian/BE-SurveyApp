import { PrismaClient } from '@prisma/client';
import { SurveyStatus } from '../utils/constants';
const prisma = new PrismaClient();

/**
 * Service for public survey access and submissions
 */
export const publicService = {
  /**
   * Get survey by slug and validate token
   */
  getSurveyPage: async (slug: string, tokenHash: string) => {
    const survey = await prisma.survey.findUnique({
      where: { slug },
      include: { questions: true },
    });

    if (!survey) return { error: 'INVALID_LINK' };

    const invitation = await prisma.invitation.findFirst({
      where: { tokenHash, surveyId: survey.id },
    });

    if (!invitation) return { error: 'INVALID_LINK' };

    if (survey.status === SurveyStatus.Closed) return { error: 'SURVEY_CLOSED' };

    if (invitation.submittedAt) return { error: 'ALREADY_SUBMITTED' };

    return { survey, invitation };
  },

  /**
   * Submit survey response
   */
  submitResponse: async (slug: string, tokenHash: string, answers: any[]) => {
    const survey = await prisma.survey.findUnique({ where: { slug } });
    if (!survey) throw new Error('Invalid survey');

    if (survey.status === SurveyStatus.Closed) {
      throw { status: 410, message: 'Survey closed' };
    }

    const invitation = await prisma.invitation.findFirst({
      where: { tokenHash, surveyId: survey.id },
    });

    if (!invitation) throw new Error('Invalid token');

    if (invitation.submittedAt) {
      throw new Error('Already submitted');
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        surveyId: survey.id,
        invitationId: invitation.id,
        // Assuming answers are split into text and choice based on schema
        // This is a placeholder for the actual relation names in your Prisma schema
        // e.g., answerTexts: { create: ... }, answerChoices: { create: ... }
        ...answers
      },
    });

    // mark submittedAt
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { submittedAt: new Date() },
    });

    return response;
  },
};