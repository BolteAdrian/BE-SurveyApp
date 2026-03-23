import { trackingService } from "../../services/trackingService";
import prisma from "../../db/prisma";

// 1. Mock the specific Prisma instance
jest.mock("../../db/prisma", () => ({
  __esModule: true,
  default: {
    invitation: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Use a simple variable without TS annotations for the mock reference
// This prevents the "Missing initializer" / "unexpected token" error
const prismaMock = prisma as any;

describe("trackingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("markEmailOpened", () => {
    it("should return null if no invitation is found", async () => {
      prismaMock.invitation.findFirst.mockResolvedValue(null);

      const result = await trackingService.markEmailOpened("token-hash");

      expect(result).toBeNull();
      expect(prismaMock.invitation.update).not.toHaveBeenCalled();
    });

    it("should update emailOpenedAt if null", async () => {
      const mockInv = { id: "inv-1", emailOpenedAt: null };
      prismaMock.invitation.findFirst.mockResolvedValue(mockInv);
      prismaMock.invitation.update.mockResolvedValue({
        ...mockInv,
        emailOpenedAt: new Date(),
      });

      await trackingService.markEmailOpened("token-hash");

      expect(prismaMock.invitation.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { emailOpenedAt: expect.any(Date) },
      });
    });

    it("should return the invitation without updating if already marked as opened", async () => {
      const existingDate = new Date();
      (prismaMock.invitation.findFirst as jest.Mock).mockResolvedValue({
        id: "inv-1",
        emailOpenedAt: existingDate,
      });

      const result = await trackingService.markEmailOpened("token-hash");

      expect(prismaMock.invitation.update).not.toHaveBeenCalled();
      expect(result?.emailOpenedAt).toBe(existingDate);
    });
  });

  describe("markSurveyOpened", () => {
    const mockFullInv = {
      id: "inv-1",
      surveyOpenedAt: null,
      survey: { status: "PUBLISHED", questions: [] },
    };

    it("should return null if survey is not PUBLISHED", async () => {
      prismaMock.invitation.findFirst.mockResolvedValue({
        ...mockFullInv,
        survey: { status: "DRAFT" },
      });

      const result = await trackingService.markSurveyOpened("token-hash");

      expect(result).toBeNull();
    });

    it("should update surveyOpenedAt and handle deep includes", async () => {
      prismaMock.invitation.findFirst.mockResolvedValue(mockFullInv);

      const result = await trackingService.markSurveyOpened("token-hash");

      expect(prismaMock.invitation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.any(Object),
        }),
      );

      expect(prismaMock.invitation.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { surveyOpenedAt: expect.any(Date) },
      });
      expect(result).toEqual(mockFullInv);
    });

    it("should not perform a DB update if surveyOpenedAt is already set", async () => {
      const alreadyOpened = {
        ...mockFullInv,
        surveyOpenedAt: new Date(),
      };
      (prismaMock.invitation.findFirst as jest.Mock).mockResolvedValue(
        alreadyOpened,
      );

      const result = await trackingService.markSurveyOpened("token-hash");

      expect(prismaMock.invitation.update).not.toHaveBeenCalled();
      expect(result).toEqual(alreadyOpened);
    });
  });
});
