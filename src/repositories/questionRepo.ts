import { IQuestion } from "../entities/IQuestion";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class QuestionRepository {
  async createQuestion(question: Omit<IQuestion, "id">) {
    return prisma.question.create({ data: question });
  }

  async updateQuestion(id: string, data: Partial<IQuestion>) {
    return prisma.question.update({ where: { id }, data });
  }

  async deleteQuestion(id: string) {
    return prisma.question.delete({ where: { id } });
  }
}