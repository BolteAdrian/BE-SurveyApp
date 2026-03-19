import { PrismaClient } from "@prisma/client";
import { ISurvey } from "../entities/ISurvey";

const prisma = new PrismaClient();

export class SurveyRepository {
  async createSurvey(survey: Omit<ISurvey, "id" | "createdAt">) {
    return prisma.survey.create({ data: survey });
  }

  async getSurveyById(id: string) {
    return prisma.survey.findUnique({
      where: { id },
      include: { questions: { include: { options: true } } },
    });
  }

  async updateSurvey(id: string, data: Partial<ISurvey>) {
    return prisma.survey.update({ where: { id }, data });
  }

  async deleteSurvey(id: string) {
    return prisma.survey.delete({ where: { id } });
  }
}

