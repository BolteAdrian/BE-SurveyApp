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
    // 1. Validation: Ensure the survey exists and is in PUBLISHED state
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey || survey.status !== "PUBLISHED") {
      throw new Error("Invitations can only be sent for PUBLISHED surveys.");
    }

    // 2. Fetch all contacts associated with the provided email list
    const contacts = await prisma.emailContact.findMany({
      where: { emailListId: listId },
    });

    // 3. ANTI-DUPLICATION RULE: Find contacts who already have an invitation for this survey
    const existingInvitations = await prisma.invitation.findMany({
      where: {
        surveyId,
        contactId: { in: contacts.map((c) => c.id) },
      },
      select: { contactId: true },
    });

    // Create a Set of IDs for O(1) lookup efficiency
    const existingContactIds = new Set(
      existingInvitations.map((i) => i.contactId),
    );

    // 4. FILTERING: Identify only the contacts that haven't been invited yet
    const newContacts = contacts.filter((c) => !existingContactIds.has(c.id));

    // If everyone in the list was already invited, stop here
    if (newContacts.length === 0) {
      return { sent: 0, skipped: contacts.length };
    }

    const invitationsToCreate = [];
    const mapping: Record<string, string> = {}; // Temporarily store raw tokens: contactId -> rawToken

    // 5. PREPARATION: Generate unique tokens and hashes for each new invitation
    for (const contact of newContacts) {
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

    // 6. DATABASE INSERT: Save the new invitations to the DB
    await prisma.invitation.createMany({
      data: invitationsToCreate,
    });

    // 7. EMAIL DELIVERY: Send emails ONLY to the newly created invitees
    const mailPromises = newContacts.map((contact) => {
      const rawToken = mapping[contact.id];
      const inviteUrl = `${config.frontendURL}/s/${survey.slug}?t=${rawToken}`;

      return mailService.sendInvitation(contact.email, survey.title, inviteUrl);
    });

    // Execute all email sending tasks in parallel
    await Promise.all(mailPromises);

    // Return the counts for the UI preview/notification
    return {
      sent: newContacts.length,
      skipped: existingContactIds.size,
    };
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

  /**
   * Generates a unique test contact and invitation link every time.
   * Perfect for filling the survey multiple times to see charts update.
   */
  generateQuickLink: async (surveyId: string) => {
    // 1. Ensure the survey exists
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) throw new Error("Survey not found");

    // 2. Find a list to attach the contact to
    const firstList = await prisma.emailList.findFirst();
    if (!firstList)
      throw new Error("Please create at least one Email List first.");

    // 3. Create a UNIQUE Test Contact using a timestamp
    // This ensures we never hit a "Unique constraint" error on Email
    const uniqueSuffix = Date.now(); // ex: 1711384567
    const testContact = await prisma.emailContact.create({
      data: {
        email: `test-${uniqueSuffix}@internal.app`,
        name: `User ${uniqueSuffix.toString().slice(-4)}`,
        emailListId: firstList.id,
      },
    });

    // 4. Generate tokens
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    // 5. Create the invitation for this SPECIFIC new contact
    await prisma.invitation.create({
      data: {
        surveyId,
        contactId: testContact.id,
        tokenHash,
        sentAt: new Date(),
      },
    });

    // 6. Return the full URL
    return {
      inviteUrl: `${config.frontendURL}/s/${survey.slug}?t=${rawToken}`,
    };
  },
};
