import { publicService } from "../../services/publicService";
import prisma from "../../db/prisma";
import { validateToken, validateAnswers } from "../../utils/validators";
import { SurveyStatus } from "../../utils/constants";
import crypto from "crypto";

// 1. Mock Prisma instance from your DB config file
jest.mock("../../db/prisma", () => ({
  __esModule: true,
  default: {
    survey: { findUnique: jest.fn() },
    invitation: { findFirst: jest.fn(), update: jest.fn() },
    response: { create: jest.fn() },
  },
}));

// 2. Mock external utility validators
jest.mock("../../utils/validators", () => ({
  validateToken: jest.fn(),
  validateAnswers: jest.fn(),
}));

// 3. Mock tracking service to avoid side effects
jest.mock("../../services/trackingService", () => ({
  trackingService: { markSurveyOpened: jest.fn() },
}));

const prismaMock = prisma as jest.Mocked<typeof prisma>;

describe("publicService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSurveyPage", () => {
    it("should return INVALID_LINK if token validation fails (MISSING/INVALID)", async () => {
      (validateToken as jest.Mock).mockResolvedValue({
        valid: false,
        reason: "MISSING",
      });

      const result = await publicService.getSurveyPage("slug", "token");

      expect(result).toEqual({ error: "INVALID_LINK" });
    });

    it("should return SURVEY_CLOSED when token validation reason is CLOSED", async () => {
      (validateToken as jest.Mock).mockResolvedValue({
        valid: false,
        reason: "CLOSED",
      });

      const result = await publicService.getSurveyPage("slug", "token");

      expect(result).toEqual({ error: "SURVEY_CLOSED" });
    });

    it("should return survey and invitation data if validation is successful", async () => {
      const mockInvitation = {
        id: "inv1",
        surveyId: "survey-uuid-1",
        submittedAt: null,
      };
      (validateToken as jest.Mock).mockResolvedValue({
        valid: true,
        invitation: mockInvitation,
      });

      const result = await publicService.getSurveyPage("slug", "token");

      expect(result).toEqual({
        survey: "survey-uuid-1",
        invitation: mockInvitation,
      });
    });
  });

  describe("submitResponse", () => {
    const mockSurvey = {
      id: "s1",
      status: SurveyStatus.Published,
      questions: [
        { id: "q1", type: "TEXT" },
        { id: "q2", type: "CHOICE" },
      ],
    };

    it("should throw 410 error if the survey status is Closed", async () => {
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue({
        ...mockSurvey,
        status: SurveyStatus.Closed,
      });

      await expect(
        publicService.submitResponse("slug", "token", []),
      ).rejects.toMatchObject({ status: 410, message: "Survey closed" });
    });

    it("should return VALIDATION_FAILED if answers do not pass schema validation", async () => {
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);
      (validateAnswers as jest.Mock).mockReturnValue([
        { field: "q1", error: "Required" },
      ]);

      const result = await publicService.submitResponse("slug", "token", []);

      expect(result).toEqual({
        error: "VALIDATION_FAILED",
        errors: expect.any(Array),
      });
    });

    it("should hash the raw token before querying the database", async () => {
      const rawToken = "user-secret-token";
      const expectedHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);
      (validateAnswers as jest.Mock).mockReturnValue([]);
      (prismaMock.invitation.findFirst as jest.Mock).mockResolvedValue(null);

      // We expect it to fail later, but we check the call to findFirst
      try {
        await publicService.submitResponse("slug", rawToken, []);
      } catch (e) {}

      expect(prismaMock.invitation.findFirst).toHaveBeenCalledWith({
        where: { tokenHash: expectedHash, surveyId: mockSurvey.id },
      });
    });

    it("should correctly separate Choice answers from Text answers and save them", async () => {
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);
      (validateAnswers as jest.Mock).mockReturnValue([]); // No errors
      (prismaMock.invitation.findFirst as jest.Mock).mockResolvedValue({
        id: "inv1",
      });

      const mixedAnswers = [
        { questionId: "q1", textValue: "My comment" },
        { questionId: "q2", optionId: "opt-99" },
      ];

      await publicService.submitResponse("slug", "token", mixedAnswers);

      // Verify Prisma create call structure
      expect(prismaMock.response.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          answersChoice: {
            create: [{ questionId: "q2", optionId: "opt-99" }],
          },
          answersText: {
            create: [{ questionId: "q1", textValue: "My comment" }],
          },
        }),
      });
    });

    it("should update invitation status and return success:true upon completion", async () => {
      (prismaMock.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);
      (validateAnswers as jest.Mock).mockReturnValue([]);
      (prismaMock.invitation.findFirst as jest.Mock).mockResolvedValue({
        id: "inv-final",
        submittedAt: null,
      });

      const result = await publicService.submitResponse("slug", "token", []);

      expect(prismaMock.invitation.update).toHaveBeenCalledWith({
        where: { id: "inv-final" },
        data: { submittedAt: expect.any(Date) },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
