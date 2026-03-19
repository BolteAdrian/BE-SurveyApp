import { PrismaClient } from '@prisma/client';
import { trackingService } from '../../services/trackingService';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    invitation: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mPrisma),
  };
});

const prisma = new PrismaClient();

/**
 * Fix TypeScript typing
 */
const prismaMock = prisma as unknown as {
  invitation: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
};

describe('trackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markEmailOpened', () => {
    it('should do nothing if invitation not found', async () => {
      prismaMock.invitation.findFirst.mockResolvedValue(null);

      await trackingService.markEmailOpened('token');

      expect(prismaMock.invitation.update).not.toHaveBeenCalled();
    });

    it('should set emailOpenedAt if null', async () => {
      prismaMock.invitation.findFirst.mockResolvedValue({
        id: 'inv1',
        emailOpenedAt: null,
      });

      await trackingService.markEmailOpened('token');

      expect(prismaMock.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { emailOpenedAt: expect.any(Date) },
      });
    });

    it('should NOT update if emailOpenedAt already exists', async () => {
      prismaMock.invitation.findFirst.mockResolvedValue({
        id: 'inv1',
        emailOpenedAt: new Date(),
      });

      await trackingService.markEmailOpened('token');

      expect(prismaMock.invitation.update).not.toHaveBeenCalled();
    });
  });

  describe('markSurveyOpened', () => {
    it('should return null if invitation not found', async () => {
      prismaMock.invitation.findFirst.mockResolvedValue(null);

      const result = await trackingService.markSurveyOpened('token');

      expect(result).toBeNull();
    });

    it('should set surveyOpenedAt if null', async () => {
      prismaMock.invitation.findFirst.mockResolvedValue({
        id: 'inv1',
        surveyOpenedAt: null,
      });

      await trackingService.markSurveyOpened('token');

      expect(prismaMock.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { surveyOpenedAt: expect.any(Date) },
      });
    });

    it('should NOT update if surveyOpenedAt already exists', async () => {
      prismaMock.invitation.findFirst.mockResolvedValue({
        id: 'inv1',
        surveyOpenedAt: new Date(),
      });

      await trackingService.markSurveyOpened('token');

      expect(prismaMock.invitation.update).not.toHaveBeenCalled();
    });

    it('should return invitation', async () => {
      const invitation = { id: 'inv1', surveyOpenedAt: null };

      prismaMock.invitation.findFirst.mockResolvedValue(invitation);

      const result = await trackingService.markSurveyOpened('token');

      expect(result).toEqual(invitation);
    });
  });
});