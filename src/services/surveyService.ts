import prisma from "../db/prisma";
import { IQuestionWithOptions } from "../entities/IQuestion";
import { ISurvey } from "../entities/ISurvey";
import { SurveyStatus } from "../utils/constants";

/**
 * Service for handling Surveys.
 */
export const surveyService = {
  /**
   * Create a new survey in draft status.
   */
  createSurvey: async (
    title: string,
    slug: string,
    ownerId: string,
    questions: IQuestionWithOptions[],
    status: SurveyStatus,
    description?: string,
  ) => {
    const data: ISurvey = {
      title,
      description,
      slug,
      status: status || SurveyStatus.DRAFT,
      ownerId,
      createdAt: new Date(),
      publishedAt: null,
      closedAt: null,
    };

    const survey = await prisma.survey.create({ data });

    if (questions?.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const q of questions) {
          const question = await tx.question.create({
            data: {
              title: q.title,
              type: q.type,
              required: q.required ?? false,
              order: q.order,
              surveyId: survey.id,
              maxLength: q.maxLength,
              maxSelections: q.maxSelections,
            },
          });

          if (q.options?.length > 0) {
            const optionsData = q.options.map((o) => ({
              label: o.label,
              order: o.order,
              questionId: question.id,
            }));

            await tx.option.createMany({ data: optionsData });
          }
        }
      });
    }

    return prisma.survey.findUnique({
      where: { id: survey.id },
      include: { questions: true },
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
    if (survey.status !== SurveyStatus.DRAFT)
      throw new Error("Cannot edit a published/closed survey");
    return prisma.survey.update({ where: { id }, data });
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
      data: { status: SurveyStatus.PUBLISHED },
    });
  },

  /**
   * Close a survey (irreversible)
   */
  closeSurvey: async (surveyId: string) => {
    return prisma.survey.update({
      where: { id: surveyId },
      data: { status: SurveyStatus.CLOSED },
    });
  },

/**
 * Get all surveys with counts for questions, total invitations, and submissions
 */
getSurveys: async (status?: SurveyStatus) => {
  const where = status ? { status } : {};

  const surveys = await prisma.survey.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          questions: true,
          invitations: true, 
        },
      },
      invitations: {
        where: {
          submittedAt: { not: null }
        },
        select: {
          id: true
        }
      }
    },
  });

  return surveys.map(s => ({
    ...s,
    submittedCount: s.invitations.length,
    invitations: undefined 
  }));
},
  /**
   * Get a single survey by id, with questions
   */
  getSurvey: async (id: string) => {
    return prisma.survey.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  /**
   * Delete a survey (only if draft)
   */
  deleteSurvey: async (surveyId: string) => {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new Error("Survey not found");
    }

    if (survey.status !== SurveyStatus.DRAFT) {
      throw new Error("Only draft surveys can be deleted");
    }

    return prisma.$transaction([
      // answers
      prisma.answerChoice.deleteMany({
        where: { question: { surveyId } },
      }),
      prisma.answerText.deleteMany({
        where: { question: { surveyId } },
      }),

      // options
      prisma.option.deleteMany({
        where: { question: { surveyId } },
      }),

      // questions
      prisma.question.deleteMany({
        where: { surveyId },
      }),

      // survey
      prisma.survey.delete({
        where: { id: surveyId },
      }),
    ]);
  },

  /**
   * Get a single question with options
   */
  getQuestion: async (surveyId: string, questionId: string) => {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!question || question.surveyId !== surveyId) {
      throw new Error("Question not found in this survey");
    }

    return question;
  },

  /**
   * Add question to a survey (only if draft)
   */
addQuestion: async (surveyId: string, questionData: any) => {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  
  if (!survey || survey.status !== SurveyStatus.DRAFT) {
    throw new Error("Survey not editable");
  }

  const { options, ...questionBody } = questionData;

  return prisma.question.create({
    data: {
      ...questionBody,
      surveyId,
      options: options && options.length > 0 ? {
        create: options.map((opt: any) => ({
          label: opt.label,
          order: opt.order
        }))
      } : undefined
    },
    include: {
      options: true
    }
  });
},

  /**
   * Update question (only if survey draft)
   */
  updateQuestion: async (surveyId: string, questionId: string, data: any) => {
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });

    if (!survey || survey.status !== SurveyStatus.DRAFT)
      throw new Error("Survey not editable");

    return prisma.question.update({
      where: { id: questionId },
      data: {
        title: data.title,
        type: data.type,
        required: data.required,
        maxSelections: data.maxSelections,
        maxLength: data.maxLength,
        order: data.order,
        options:
          data.type === "CHOICE"
            ? {
                deleteMany: {},
                create: data.options,
              }
            : undefined,
      },
      include: {
        options: true,
      },
    });
  },

  /**
   * Delete a question
   * @param surveyId
   * @param questionId
   * @returns
   */
  deleteQuestion: async (surveyId: string, questionId: string) => {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey || survey.status !== SurveyStatus.DRAFT) {
      throw new Error("Survey not editable");
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question || question.surveyId !== surveyId) {
      throw new Error("Question not found in this survey");
    }

    return prisma.$transaction([
      prisma.option.deleteMany({ where: { questionId } }),
      prisma.answerChoice.deleteMany({ where: { questionId } }),
      prisma.answerText.deleteMany({ where: { questionId } }),
      prisma.question.delete({ where: { id: questionId } }),
    ]);
  },
};
