
import { PrismaClient } from '@prisma/client';
import { publicService } from '../../services/publicService';
import { SurveyStatus } from '../../utils/constants';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    survey: {
      findUnique: jest.fn(),
    },
    invitation: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    response: {
      create: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mPrisma),
  };
});

const prisma = new PrismaClient();

/**
 * Cast Prisma to mocked version (fix TypeScript issues)
 */
const prismaMock = prisma as unknown as {
  survey: { findUnique: jest.Mock };
  invitation: { findFirst: jest.Mock; update: jest.Mock };
  response: { create: jest.Mock };
};

describe('publicService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSurveyPage', () => {
    it('should return INVALID_LINK if survey not found', async () => {
      prismaMock.survey.findUnique.mockResolvedValue(null);

      const result = await publicService.getSurveyPage('slug', 'token');

      expect(result).toEqual({ error: 'INVALID_LINK' });
    });

    it('should return INVALID_LINK if invitation not found', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      prismaMock.invitation.findFirst.mockResolvedValue(null);

      const result = await publicService.getSurveyPage('slug', 'token');

      expect(result).toEqual({ error: 'INVALID_LINK' });
    });

    it('should return SURVEY_CLOSED', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Closed,
      });

      prismaMock.invitation.findFirst.mockResolvedValue({
        id: 'inv1',
      });

      const result = await publicService.getSurveyPage('slug', 'token');

      expect(result).toEqual({ error: 'SURVEY_CLOSED' });
    });

    it('should return ALREADY_SUBMITTED', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      prismaMock.invitation.findFirst.mockResolvedValue({
        id: 'inv1',
        submittedAt: new Date(),
      });

      const result = await publicService.getSurveyPage('slug', 'token');

      expect(result).toEqual({ error: 'ALREADY_SUBMITTED' });
    });

    it('should return survey and invitation if valid', async () => {
      const surveyMock = {
        id: '1',
        status: SurveyStatus.Published,
        questions: [],
      };

      const invitationMock = {
        id: 'inv1',
        submittedAt: null,
      };

      prismaMock.survey.findUnique.mockResolvedValue(surveyMock);
      prismaMock.invitation.findFirst.mockResolvedValue(invitationMock);

      const result = await publicService.getSurveyPage('slug', 'token');

      expect(result).toEqual({
        survey: surveyMock,
        invitation: invitationMock,
      });
    });
  });

  describe('submitResponse', () => {
    it('should throw if survey is closed', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Closed,
      });

      await expect(
        publicService.submitResponse('slug', 'token', [])
      ).rejects.toMatchObject({ status: 410 });
    });

    it('should throw if invitation not found', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      prismaMock.invitation.findFirst.mockResolvedValue(null);

      await expect(
        publicService.submitResponse('slug', 'token', [])
      ).rejects.toThrow('Invalid token');
    });

    it('should throw if already submitted', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      prismaMock.invitation.findFirst.mockResolvedValue({
        id: 'inv1',
        submittedAt: new Date(),
      });

      await expect(
        publicService.submitResponse('slug', 'token', [])
      ).rejects.toThrow('Already submitted');
    });

    it('should create response and mark submittedAt', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      prismaMock.invitation.findFirst.mockResolvedValue({
        id: 'inv1',
        submittedAt: null,
      });

      prismaMock.response.create.mockResolvedValue({
        id: 'resp1',
      });

      prismaMock.invitation.update.mockResolvedValue({});

      const result = await publicService.submitResponse(
        'slug',
        'token',
        []
      );

      expect(prismaMock.response.create).toHaveBeenCalled();

      expect(prismaMock.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { submittedAt: expect.any(Date) },
      });

      expect(result).toEqual({ id: 'resp1' });
    });
  });
});