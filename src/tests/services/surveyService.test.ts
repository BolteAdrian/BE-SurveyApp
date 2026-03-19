import { PrismaClient } from '@prisma/client';
import { surveyService } from '../../services/surveyService';
import { SurveyStatus } from '../../utils/constants';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    survey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    question: {
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mPrisma),
  };
});

const prisma = new PrismaClient();

/**
 * Fix TypeScript typing for mocks
 */
const prismaMock = prisma as unknown as {
  survey: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  question: {
    create: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
};

describe('surveyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSurvey', () => {
    it('should create a survey in draft status', async () => {
      prismaMock.survey.create.mockResolvedValue({
        id: '1',
        title: 'Test',
        status: SurveyStatus.Draft,
      });

      const result = await surveyService.createSurvey('Test');

      expect(prismaMock.survey.create).toHaveBeenCalledWith({
        data: {
          title: 'Test',
          description: undefined,
          slug: undefined,
          status: SurveyStatus.Draft,
        },
      });

      expect(result.status).toBe(SurveyStatus.Draft);
    });
  });

  describe('updateSurvey', () => {
    it('should throw if survey not found', async () => {
      prismaMock.survey.findUnique.mockResolvedValue(null);

      await expect(
        surveyService.updateSurvey('1', { title: 'New' })
      ).rejects.toThrow('Survey not found');
    });

    it('should throw if survey is not draft', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      await expect(
        surveyService.updateSurvey('1', { title: 'New' })
      ).rejects.toThrow('Cannot edit a published/closed survey');
    });

    it('should update survey if draft', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Draft,
      });

      prismaMock.survey.update.mockResolvedValue({
        id: '1',
        title: 'New',
      });

      const result = await surveyService.updateSurvey('1', { title: 'New' });

      expect(prismaMock.survey.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'New' },
      });

      expect(result.title).toBe('New');
    });
  });

  describe('addQuestion', () => {
    it('should throw if survey is not draft', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      await expect(
        surveyService.addQuestion('1', { title: 'Q1' })
      ).rejects.toThrow('Survey not editable');
    });

    it('should create question if survey is draft', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Draft,
      });

      prismaMock.question.create.mockResolvedValue({
        id: 'q1',
        title: 'Q1',
      });

      const result = await surveyService.addQuestion('1', { title: 'Q1' });

      expect(prismaMock.question.create).toHaveBeenCalledWith({
        data: {
          title: 'Q1',
          surveyId: '1',
        },
      });

      expect(result.id).toBe('q1');
    });
  });

  describe('updateQuestion', () => {
    it('should throw if survey is not draft', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      await expect(
        surveyService.updateQuestion('1', 'q1', { title: 'New' })
      ).rejects.toThrow('Survey not editable');
    });

    it('should update question if survey is draft', async () => {
      prismaMock.survey.findUnique.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Draft,
      });

      prismaMock.question.update.mockResolvedValue({
        id: 'q1',
        title: 'New',
      });

      const result = await surveyService.updateQuestion('1', 'q1', {
        title: 'New',
      });

      expect(prismaMock.question.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { title: 'New' },
      });

      expect(result.title).toBe('New');
    });
  });

  describe('publishSurvey', () => {
    it('should throw if no questions', async () => {
      prismaMock.question.count.mockResolvedValue(0);

      await expect(
        surveyService.publishSurvey('1')
      ).rejects.toThrow('Survey must have at least one question');
    });

    it('should publish survey if has questions', async () => {
      prismaMock.question.count.mockResolvedValue(2);

      prismaMock.survey.update.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Published,
      });

      const result = await surveyService.publishSurvey('1');

      expect(prismaMock.survey.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: SurveyStatus.Published },
      });

      expect(result.status).toBe(SurveyStatus.Published);
    });
  });

  describe('closeSurvey', () => {
    it('should close survey', async () => {
      prismaMock.survey.update.mockResolvedValue({
        id: '1',
        status: SurveyStatus.Closed,
      });

      const result = await surveyService.closeSurvey('1');

      expect(prismaMock.survey.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: SurveyStatus.Closed },
      });

      expect(result.status).toBe(SurveyStatus.Closed);
    });
  });
});