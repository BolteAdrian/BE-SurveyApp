import prisma from '../db/prisma';

/**
 * Service for handling external webhooks (e.g. AWS SES)
 */
export const webhookService = {
  /**
   * Handle SES bounce notification
   * Finds the most recent active invitation for the bounced email
   */
  handleSesBounce: async (payload: any) => {
    const bouncedEmails = payload?.bounce?.bouncedRecipients || [];

    for (const recipient of bouncedEmails) {
      const email = recipient.emailAddress;

      // Find the most recent invitation for this specific email that hasn't bounced yet
      const invitation = await prisma.invitation.findFirst({
        where: {
          contact: {
            email: email.toLowerCase().trim(),
          },
          bouncedAt: null,
        },
        orderBy: {
          sentAt: "desc",
        },
      });

      if (invitation) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { bouncedAt: new Date() },
        });

        console.log(
          `[Webhook] Marked bounce for invitation: ${invitation.id} (Email: ${email})`,
        );
      }
    }
  },

  /**
   * Optional: Handle SES Complaint (Spam)
   */
  handleSesComplaint: async (payload: any) => {
    const complainedEmails = payload?.complaint?.complainedRecipients || [];

    for (const recipient of complainedEmails) {
      const email = recipient.emailAddress;

      // Similar logic to bounce, but maybe you want to blacklist the contact
      await prisma.emailContact.updateMany({
        where: { email: email.toLowerCase().trim() },
        data: { name: "COMPLAINED_USER" }, // Or a specific flag if you add one to schema
      });
    }
  },
};
