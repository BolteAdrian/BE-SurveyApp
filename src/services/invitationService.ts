import prisma from "../db/prisma";
import { generateToken, hashToken } from "../utils/token";

/**
 * Service for handling survey invitations.
 */
export const invitationService = {
  /**
   * Send invitations to contacts list
   */
  sendInvitations: async (surveyId: string, listId: string) => {
    const contacts = await prisma.emailContact.findMany({
      where: { emailListId: listId },
    });

    let sent = 0;
    let skipped = 0;

    for (const contact of contacts) {
      try {
        const rawToken = generateToken();
        const tokenHash = hashToken(rawToken);

        await prisma.invitation.create({
          data: {
            surveyId,
            contactId: contact.id,
            tokenHash,
            sentAt: new Date(),
          },
        });

        // 👉 aici vine email-ul real
        console.log(`https://app.example.com/s/${surveyId}?t=${rawToken}`);

        sent++;
      } catch (err: any) {
        // UNIQUE constraint → deja există invitația
        if (err.code === "P2002") {
          skipped++;
        } else {
          throw err;
        }
      }
    }

    return { sent, skipped };
  },

  /**
   * List invitations with pagination and search
   */
  listInvitations: async (surveyId: string, page = 1, query = "") => {
    return prisma.invitation.findMany({
      where: {
        surveyId,
        contact: {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      include: {
        contact: true,
      },
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { sentAt: "desc" },
    });
  },

  /**
   * Preview invitations before sending
   */
  previewInvitations: async (surveyId: string, listId: string) => {
    const contacts = await prisma.emailContact.findMany({
      where: { emailListId: listId },
    });

    let newEmails = 0;
    let skipped = 0;

    for (const contact of contacts) {
      const exists = await prisma.invitation.findUnique({
        where: {
          surveyId_contactId: {
            surveyId,
            contactId: contact.id,
          },
        },
      });

      if (exists) skipped++;
      else newEmails++;
    }

    return { newEmails, skipped };
  },
};
