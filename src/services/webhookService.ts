import prisma from '../db/prisma';

/**
 * Service for handling external webhooks (e.g. AWS SES)
 */
export const webhookService = {
  /**
   * Handle SES bounce notification
   */
  handleSesBounce: async (payload: any) => {
    const bouncedEmails = payload?.bounce?.bouncedRecipients || [];

    for (const recipient of bouncedEmails) {
      const email = recipient.emailAddress;

      const invitation = await prisma.invitation.findFirst({
        where: {
          contact: { email },
        },
      });

      if (invitation) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { bouncedAt: new Date() },
        });
      }
    }
  },
};