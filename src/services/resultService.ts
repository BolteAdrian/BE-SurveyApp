import prisma from "../db/prisma";
import { IAnswerChoice } from "../entities/IAnswerChoice";
import { IInvitation } from "../entities/IInvitation";
import { IOption } from "../entities/IOption";
import { QuestionType } from "../utils/constants";
import { Parser } from "json2csv";

/**
 * Service for survey results
 */
export const resultService = {
  /**
   * Summary funnel: invited → sent → email opened → survey opened → submitted → bounced
   */
  getSummary: async (surveyId: string) => {
    const invitations = await prisma.invitation.findMany({
      where: { surveyId },
    });

    return {
      invited: invitations.length,
      sent: invitations.filter((i: IInvitation) => i.sentAt).length,
      emailOpened: invitations.filter((i: IInvitation) => i.emailOpenedAt)
        .length,
      surveyOpened: invitations.filter((i: IInvitation) => i.surveyOpenedAt)
        .length,
      submitted: invitations.filter((i: IInvitation) => i.submittedAt).length,
      bounced: invitations.filter((i: IInvitation) => i.bouncedAt).length,
    };
  },

  /**
   * Question statistics: count + % per option
   */
  getQuestionStats: async (surveyId: string) => {
    const questions = await prisma.question.findMany({
      where: { surveyId, type: QuestionType.Choice },
      include: {
        options: true,
      },
    });

    const results = [];

    for (const q of questions) {
      const answers = await prisma.answerChoice.findMany({
        where: { questionId: q.id },
      });

      const total = answers.length;

      const stats = q.options.map((opt: IOption) => {
        const count = answers.filter(
          (a: IAnswerChoice) => a.optionId === opt.id,
        ).length;

        return {
          optionId: opt.id,
          label: opt.label,
          count,
          percent: total ? Math.round((count / total) * 100) : 0,
        };
      });

      results.push({
        questionId: q.id,
        title: q.title,
        stats,
      });
    }

    return results;
  },

  /**
   * Get text comments with pagination
   */
  getComments: async (
    surveyId: string,
    page = 1,
    query = "",
    questionId?: string,
  ) => {
    return prisma.answerText.findMany({
      where: {
        question: {
          surveyId,
          ...(questionId ? { id: questionId } : {}),
        },
        textValue: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        question: true,
      },
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { id: "desc" },
    });
  },
  /**
   * Export all survey responses as CSV
   */
  exportCsv: async (surveyId: string) => {
    // 1. Fetch survey questions
    const questions = await prisma.question.findMany({
      where: { surveyId },
      include: { options: true },
      orderBy: { order: "asc" },
    });

    // 2. Fetch all responses with related answer choices and text
    const responses = await prisma.response.findMany({
      where: { surveyId },
      include: {
        invitation: { include: { contact: true } },
        answersChoice: { include: { option: true } },
        answersText: true,
      },
    });

    // 3. Build CSV rows
    const rows = responses.map((resp) => {
      const row: any = {
        responseId: resp.id,
        email: resp.invitation.contact.email,
        name: resp.invitation.contact.name || "",
        submittedAt: resp.submittedAt.toISOString(),
      };

      // Add choice answers
      questions
        .filter((q) => q.type === QuestionType.Choice)
        .forEach((q) => {
          const answer = resp.answersChoice.find(
            (ac: IAnswerChoice) => ac.questionId === q.id,
          );
          row[q.title] = answer ? answer.option.label : "";
        });

      // Add text answers
      questions
        .filter((q) => q.type === QuestionType.Text)
        .forEach((q) => {
          const answer = resp.answersText.find((at) => at.questionId === q.id);
          row[q.title] = answer ? answer.textValue : "";
        });

      return row;
    });

    // 4. Convert to CSV
    const fields = [
      "responseId",
      "email",
      "name",
      "submittedAt",
      ...questions.map((q) => q.title),
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(rows);

    return csv;
  },
};
