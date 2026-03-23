import prisma from "../db/prisma";

/**
 * Service responsible for tracking email and survey events
 */
export const trackingService = {
  /**
   * Mark email as opened (pixel tracking)
   */
  markEmailOpened: async (tokenHash: string) => {
    // We use findFirst because tokenHash is indexed but not @unique in schema
    const invitation = await prisma.invitation.findFirst({
      where: { tokenHash },
    });
  
    if (!invitation) return null;

    if (!invitation.emailOpenedAt) {
      return await prisma.invitation.update({
        where: { id: invitation.id },
        data: { emailOpenedAt: new Date() },
      });
    }

    return invitation;
  },

  /**
   * Mark survey as opened (page access)
   * Returns invitation with full survey structure
   */
  markSurveyOpened: async (tokenHash: string) => {
    const invitation = await prisma.invitation.findFirst({
      where: { tokenHash },
      include: {
        survey: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!invitation) return null;

    // Safety check for survey status
    if (invitation.survey.status !== "PUBLISHED") {
      return null; // Or handle as an object that UI can interpret as "Closed"
    }

    if (!invitation.surveyOpenedAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { surveyOpenedAt: new Date() },
      });
    }

    return invitation;
  },
};
