import prisma from "../db/prisma";
import { generateToken, hashToken } from "../utils/token";
import { mailService } from "./mail.service";
import config from "../config";

/**
 * Service for handling survey invitations.
 */
export const invitationService = {
  /**
   * Send invitations to contacts list
   */
  sendInvitations: async (surveyId: string, listId: string) => {
    // 1. Validation
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey || survey.status !== "PUBLISHED") {
      throw new Error("Invitations can only be sent for PUBLISHED surveys.");
    }

    // 2. Get all contacts from the list
    const contacts = await prisma.emailContact.findMany({
      where: { emailListId: listId },
    });

    // 3. Prepare data
    const invitationsToCreate = [];
    const mapping: Record<string, string> = {}; // contactId -> rawToken

    for (const contact of contacts) {
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      
      mapping[contact.id] = rawToken;

      invitationsToCreate.push({
        surveyId,
        contactId: contact.id,
        tokenHash,
        sentAt: new Date(),
      });
    }

    // 4. Bulk insert into Database
    await prisma.invitation.createMany({
      data: invitationsToCreate,
      skipDuplicates: true,
    });

    // 5. 
    const newlyCreated = await prisma.invitation.findMany({
      where: {
        surveyId,
        contactId: { in: contacts.map(c => c.id) },
        submittedAt: null, 
      },
      include: { contact: true }
    });

    // 6. Send Emails
    const mailPromises = newlyCreated.map((inv) => {
      const rawToken = mapping[inv.contactId];
      const inviteUrl = `${config.frontendURL}/s/${survey.slug}?t=${rawToken}`;
      
      return mailService.sendInvitation(
        inv.contact.email, 
        survey.title, 
        inviteUrl
      );
    });

    await Promise.all(mailPromises);

    return { sent: newlyCreated.length };
  },

  /**
   * List invitations with pagination and search
   */
  listInvitations: async (surveyId: string, page = 1, query = "") => {
    const skip = (page - 1) * 20;
    return prisma.invitation.findMany({
      where: {
        surveyId,
        contact: {
          email: { contains: query, mode: "insensitive" },
        },
      },
      include: { contact: true },
      skip,
      take: 20,
      orderBy: { sentAt: "desc" },
    });
  },

  /**
   * Preview invitations before sending (Exactly as you wrote it)
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
          surveyId_contactId: { surveyId, contactId: contact.id },
        },
      });
      if (exists) skipped++;
      else newEmails++;
    }

    return { newEmails, skipped };
  },
};