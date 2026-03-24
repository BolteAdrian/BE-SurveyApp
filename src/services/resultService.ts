import prisma from "../db/prisma";
import { IAnswerChoice } from "../entities/IAnswerChoice";
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
    const [survey, counts] = await Promise.all([
      prisma.survey.findUnique({
        where: { id: surveyId },
        select: { title: true },
      }),
      prisma.invitation.aggregate({
        where: { surveyId },
        _count: {
          _all: true,
          sentAt: true,
          emailOpenedAt: true,
          surveyOpenedAt: true,
          submittedAt: true,
          bouncedAt: true,
        },
      }),
    ]);

    if (!survey) {
      throw new Error("Survey not found");
    }

    return {
      title: survey.title,
      invited: counts._count._all,
      sent: counts._count.sentAt,
      emailOpened: counts._count.emailOpenedAt,
      surveyOpened: counts._count.surveyOpenedAt,
      submitted: counts._count.submittedAt,
      bounced: counts._count.bouncedAt,
    };
  },

  /**
   * Question statistics: count + % per option
   */
  getQuestionStats: async (surveyId: string) => {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { title: true, status: true },
    });

    const questions = await prisma.question.findMany({
      where: { surveyId },
      include: {
        options: {
          include: { _count: { select: { answerChoices: true } } },
        },
        answersChoice: { select: { responseId: true } },
        _count: { select: { answersChoice: true, answersText: true } },
      },
      orderBy: { order: "asc" },
    });

    const totalResponses = await prisma.response.count({ where: { surveyId } });

    const questionsWithStats = questions.map((q) => {
      const uniqueResponders =
        q.type === QuestionType.CHOICE
          ? new Set(q.answersChoice.map((a) => a.responseId)).size
          : q._count.answersText;

      return {
        id: q.id,
        title: q.title,
        type: q.type,
        totalAnswers: uniqueResponders,
        stats:
          q.type === QuestionType.CHOICE && totalResponses > 0
            ? q.options.map((opt) => ({
                optionId: opt.id,
                label: opt.label,
                count: opt._count.answerChoices,
                percent:
                  totalResponses > 0
                    ? Math.round(
                        (opt._count.answerChoices / totalResponses) * 100,
                      )
                    : 0,
              }))
            : undefined,
      };
    });
    return { survey, questions: questionsWithStats };
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
        response: {
          select: {
            submittedAt: true,
          },
        },
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
        email: resp.invitation.contact.email,
        name: resp.invitation.contact.name || "",
        submittedAt: resp.submittedAt.toISOString(),
      };

      // Add choice answers
      questions
        .filter((q) => q.type === QuestionType.CHOICE)
        .forEach((q) => {
          const answer = resp.answersChoice.find(
            (ac: IAnswerChoice) => ac.questionId === q.id,
          );
          row[q.title] = answer ? answer.option.label : "";
        });

      // Add text answers
      questions
        .filter((q) => q.type === QuestionType.TEXT)
        .forEach((q) => {
          const answer = resp.answersText.find((at) => at.questionId === q.id);
          row[q.title] = answer ? answer.textValue : "";
        });

      return row;
    });

    // 4. Convert to CSV
    const fields = [
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
