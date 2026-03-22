
import { SurveyStatus } from '@prisma/client';
import prisma from '../db/prisma';
import crypto from 'crypto';

/**
 * Validate token for a survey invitation
 * @param slug Survey slug
 * @param rawToken Token from URL
 */
export async function validateToken(slug: string, rawToken: string) {
  if (!rawToken) return { valid: false, reason: 'MISSING' };

  // Hash the raw token
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Find invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      tokenHash: hash,
      survey: { slug },
      OR: [
        { sentAt: { not: undefined } },
        { emailOpenedAt: { not: undefined } }
      ]
    },
    include: { survey: true }
  });

  if (!invitation) return { valid: false, reason: 'INVALID' };
  if (invitation.survey.status === SurveyStatus.CLOSED) return { valid: false, reason: SurveyStatus.CLOSED };
  if (invitation.submittedAt) return { valid: false, reason: 'ALREADY_SUBMITTED' };

  return { valid: true, invitation };
}

export const validateMultiChoice = (
  selected: string[],
  required: boolean,
  maxSelections: number,
  questionId: string
) => {
  const errors = [];

  if (required && selected.length === 0) {
    errors.push({
      questionId,
      code: 'REQUIRED',
      message: 'This question is required.',
    });
  }

  if (selected.length > maxSelections) {
    errors.push({
      questionId,
      code: 'MAX_SELECTIONS_EXCEEDED',
      message: `You can select maximum ${maxSelections} options.`,
    });
  }

  return errors;
};

export const validateText = (
  value: string,
  required: boolean,
  maxLength: number,
  questionId: string
) => {
  const errors = [];

  if (required && value.trim().length === 0) {
    errors.push({
      questionId,
      code: 'REQUIRED',
      message: 'This question is required.',
    });
  }

  if (value.length > maxLength) {
    errors.push({
      questionId,
      code: 'MAX_LENGTH_EXCEEDED',
      message: `Maximum length is ${maxLength} characters.`,
    });
  }

  return errors;
};

export const validateAnswers = (questions: any[], answers: any[]) => {
  const errors = [];

  for (const question of questions) {
    const answer = answers.find(a => a.questionId === question.id);

    if (question.type === 'choice') {
      const selected = answer?.optionIds || [];

      errors.push(
        ...validateMultiChoice(
          selected,
          question.required,
          question.maxSelections,
          question.id
        )
      );
    }

    if (question.type === 'text') {
      const value = answer?.textValue || '';

      errors.push(
        ...validateText(
          value,
          question.required,
          question.maxLength ?? 1000,
          question.id
        )
      );
    }
  }

  return errors;
};
