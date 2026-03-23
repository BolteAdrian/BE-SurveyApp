import prisma from "../db/prisma";
import { validateAnswers, validateToken } from "../utils/validators";
import crypto from "crypto";
import { trackingService } from "./trackingService";
import { SurveyStatus } from "../utils/constants";

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
      return {
        error: (result.reason && errorMap[result.reason]) || "INVALID_LINK",
      };
    }

    return {
      survey: result.invitation?.surveyId,
      invitation: result.invitation,
    };
  },

  /**
   * Submit survey response
   * @param slug Survey slug
   * @param rawToken Invitation token hash
   * @param answers Array of answers
   */
  submitResponse: async (slug: string, rawToken: string, answers: any[]) => {
    const survey = await prisma.survey.findUnique({
      where: { slug },
      include: { questions: true },
    });

    if (!survey) throw new Error("Invalid survey");

    if (survey.status === SurveyStatus.CLOSED) {
      throw { status: 410, message: "Survey closed" };
    }

    // Hash the raw token
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const invitation = await prisma.invitation.findFirst({
      where: { tokenHash, surveyId: survey.id },
    });

    // Validate answers
    const errors = validateAnswers(survey.questions, answers);
    if (errors.length > 0) return { error: "VALIDATION_FAILED", errors };

    if (!invitation) {
      const err: any = new Error("INVALID_LINK");
      err.status = 409;
      throw err;
    }

    if (invitation.submittedAt) {
      const err: any = new Error("ALREADY_SUBMITTED");
      err.status = 409;
      throw err;
    }

    const answersChoice = answers
      .filter((a) => a.optionId)
      .map((a) => ({
        questionId: a.questionId,
        optionId: a.optionId,
      }));

    const answersText = answers
      .filter((a) => a.textValue !== undefined)
      .map((a) => ({
        questionId: a.questionId,
        textValue: String(a.textValue),
      }));

    await prisma.response.create({
      data: {
        surveyId: survey.id,
        invitationId: invitation.id,
        answersChoice: {
          create: answersChoice,
        },
        answersText: {
          create: answersText,
        },
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { submittedAt: new Date() },
    });

    // Optionally mark survey opened
    await trackingService.markSurveyOpened(tokenHash);

    return { success: true };
  },
};
