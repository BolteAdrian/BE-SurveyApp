import { PrismaClient } from "@prisma/client";
import { IInvitation } from "../entities/IInvitation";

const prisma = new PrismaClient();

export class InvitationRepository {
  async createInvitation(inv: Omit<IInvitation, "id">) {
    const { response, ...data } = inv;
    return prisma.invitation.create({ 
      data: { 
        ...data, 
        sentAt: data.sentAt || new Date() 
      } 
    });
  }

  async getByToken(tokenHash: string) {
    return prisma.invitation.findFirst({ where: { tokenHash } });
  }

  async markEmailOpened(id: string) {
    return prisma.invitation.update({
      where: { id },
      data: { emailOpenedAt: new Date() },
    });
  }

  async markSurveyOpened(id: string) {
    return prisma.invitation.update({
      where: { id },
      data: { surveyOpenedAt: new Date() },
    });
  }

  async markSubmitted(id: string) {
    return prisma.invitation.update({
      where: { id },
      data: { submittedAt: new Date() },
    });
  }
}