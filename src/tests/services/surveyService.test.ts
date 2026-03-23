import { surveyService } from "../../services/surveyService";
import { SurveyStatus } from "../../utils/constants";
import prisma from "../../db/prisma";

jest.mock("../../db/prisma", () => {
  // Create the mock object INSIDE the factory
  const m:any = {
    survey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    question: {
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    option: { createMany: jest.fn(), deleteMany: jest.fn() },
    answerChoice: { deleteMany: jest.fn() },
    answerText: { deleteMany: jest.fn() },
    $transaction: jest.fn((input) => {
      // Logic to handle both array of promises and callback functions
      if (typeof input === "function") return input(m);
      return Promise.all(input);
    }),
  };
  return { __esModule: true, default: m };
});

const prismaMock = prisma as any;

describe("surveyService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSurvey", () => {
    it("should create a survey and return it with questions included", async () => {
      const mockSurvey = {
        id: "s1",
        title: "New Survey",
        status: SurveyStatus.Draft,
      };

      (prismaMock.survey.create as jest.Mock).mockResolvedValue(mockSurvey);
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue({
        ...mockSurvey,
        questions: [],
      });

      const result = await surveyService.createSurvey(
        "New Survey",
        "slug-1",
        "user-1",
        [], // No initial questions
      );

      // Verify correct data is sent to Prisma
      expect(prismaMock.survey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "New Survey",
          slug: "slug-1",
          ownerId: "user-1",
          status: SurveyStatus.Draft,
        }),
      });
      expect(result?.id).toBe("s1");
    });

    it("should handle nested questions creation during survey setup", async () => {
      const mockSurvey = { id: "s1" };
      (prismaMock.survey.create as jest.Mock).mockResolvedValue(mockSurvey);
      // Mocking the question create inside the transaction loop
      (prismaMock.question.create as jest.Mock).mockResolvedValue({ id: "q1" });

      const questions = [
        {
          title: "Q1",
          type: "CHOICE",
          order: 1,
          options: [{ label: "Opt 1", order: 1 }],
        },
      ] as any;

      await surveyService.createSurvey("Title", "slug", "owner", questions);

      expect(prismaMock.question.create).toHaveBeenCalled();
      expect(prismaMock.option.createMany).toHaveBeenCalled();
    });
  });

  describe("updateSurvey", () => {
    it('should throw "Survey not found" if ID does not exist', async () => {
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        surveyService.updateSurvey("non-existent", { title: "New" }),
      ).rejects.toThrow("Survey not found");
    });

    it("should prevent updates if the survey is already Published", async () => {
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue({
        id: "1",
        status: SurveyStatus.Published,
      });

      await expect(
        surveyService.updateSurvey("1", { title: "New" }),
      ).rejects.toThrow("Cannot edit a published/closed survey");
    });
  });

  describe("publishSurvey", () => {
    it("should block publishing if the survey has zero questions", async () => {
      (prismaMock.question.count as jest.Mock).mockResolvedValue(0);

      await expect(surveyService.publishSurvey("1")).rejects.toThrow(
        "Survey must have at least one question",
      );
    });

    it("should update status to Published if requirements are met", async () => {
      (prismaMock.question.count as jest.Mock).mockResolvedValue(5);
      (prismaMock.survey.update as jest.Mock).mockResolvedValue({
        status: SurveyStatus.Published,
      });

      const result = await surveyService.publishSurvey("1");

      expect(prismaMock.survey.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { status: SurveyStatus.Published },
      });
      expect(result.status).toBe(SurveyStatus.Published);
    });
  });

  describe("deleteSurvey", () => {
    it("should throw error if trying to delete a non-draft survey", async () => {
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue({
        id: "1",
        status: SurveyStatus.Published,
      });

      await expect(surveyService.deleteSurvey("1")).rejects.toThrow(
        "Only draft surveys can be deleted",
      );
    });

    it("should execute a transaction to clean up all related data on deletion", async () => {
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue({
        id: "s1",
        status: SurveyStatus.Draft,
      });

      await surveyService.deleteSurvey("s1");

      // Check if transaction was called to delete questions, options, and survey
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.survey.delete).toHaveBeenCalledWith({
        where: { id: "s1" },
      });
    });
  });

  describe("getSurveys", () => {
    it("should include question counts in the list", async () => {
      await surveyService.getSurveys();

      expect(prismaMock.survey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: { select: { questions: true } },
          },
        }),
      );
    });
  });
});
