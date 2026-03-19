import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Service responsible for tracking email and survey events
 */
export const trackingService = {
  /**
   * Mark email as opened (pixel tracking)
   * Only sets emailOpenedAt if it's not already set
   */
  markEmailOpened: async (tokenHash: string) => {
    const invitation = await prisma.invitation.findFirst({
      where: { tokenHash },
    });

    if (!invitation) return;

    if (!invitation.emailOpenedAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { emailOpenedAt: new Date() },
      });
    }
  },

  /**
   * Mark survey as opened (page access)
   * Only sets surveyOpenedAt if it's not already set
   */
  markSurveyOpened: async (tokenHash: string) => {
    const invitation = await prisma.invitation.findFirst({
      where: { tokenHash },
    });

    if (!invitation) return null;

    if (!invitation.surveyOpenedAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { surveyOpenedAt: new Date() },
      });
    }

    return invitation;
  },
};