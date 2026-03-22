import prisma from '../db/prisma';
import { SurveyStatus } from "../utils/constants";
import { trackingService } from "./trackingService";
import { validateAnswers, validateToken } from "../utils/validators";

/**
 * Service for public survey access and submissions
 */
export const publicService = {
  /**
   * Get survey by slug and validate token
   * @param slug Survey slug
   * @param tokenHash Invitation token hash
   */
  getSurveyPage: async (slug: string, tokenHash: string) => {
    const result = await validateToken(slug, tokenHash);

    if (!result.valid) {
      // map reason codes to your API error messages
      const errorMap: Record<string, string> = {
        MISSING: "INVALID_LINK",
        INVALID: "INVALID_LINK",
        CLOSED: "SURVEY_CLOSED",
        ALREADY_SUBMITTED: "ALREADY_SUBMITTED",
      };
      return { error: (result.reason && errorMap[result.reason]) || "INVALID_LINK" };
    }

    return { survey: result.invitation?.survey, invitation: result.invitation };
  },

  /**
   * Submit survey response
   * @param slug Survey slug
   * @param tokenHash Invitation token hash
   * @param answers Array of answers
   */
  submitResponse: async (slug: string, tokenHash: string, answers: any[]) => {
    const survey = await prisma.survey.findUnique({
      where: { slug },
      include: { questions: true },
    });

    if (!survey) throw new Error("Invalid survey");

    if (survey.status === SurveyStatus.Closed) {
      throw { status: 410, message: "Survey closed" };
    }

    const invitation = await prisma.invitation.findFirst({
      where: { tokenHash, surveyId: survey.id },
    });

    if (!invitation) throw new Error("Invalid token");

    if (invitation.submittedAt) throw new Error("Already submitted");

    // Validate answers
    const errors = validateAnswers(survey.questions, answers);
    if (errors.length > 0) return { error: "VALIDATION_FAILED", errors };

    // Save responses (text and choice answers)
    for (const answer of answers) {
      await prisma.response.create({
        data: {
          surveyId: survey.id,
          invitationId: invitation.id,
          // Assuming answers are split into text and choice based on schema
          // This is a placeholder for the actual relation names in your Prisma schema
          // e.g., answerTexts: { create: ... }, answerChoices: { create: ... }
          ...answers,
        },
      });
    }

    // Mark invitation as submitted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { submittedAt: new Date() },
    });

    // Optionally mark survey opened
    await trackingService.markSurveyOpened(tokenHash);

    return { success: true };
  },
};
