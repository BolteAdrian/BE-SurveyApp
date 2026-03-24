import prisma from "../db/prisma";

export const emailListService = {
  /**
   * Get a single email list by its ID, including contact count and all contacts
   */
  getList: async (listId: string) => {
    const list = await prisma.emailList.findUnique({
      where: { id: listId },
      include: {
        emailContacts: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!list) return null;

    return {
      id: list.id,
      name: list.name,
      ownerId: list.ownerId,
      createdAt: list.createdAt,
      emailContacts: list.emailContacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
      })),
    };
  },

  /**
   * Get all lists for a specific owner with contact count
   */
  getAllLists: async (ownerId: string) => {
    return await prisma.emailList.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: { emailContacts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a single list with all its contacts
   */
  getListById: async (id: string) => {
    return await prisma.emailList.findUnique({
      where: { id },
      include: {
        emailContacts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  /**
   * Create a new email list
   */
  createList: async (name: string, ownerId: string) => {
    return await prisma.emailList.create({
      data: { name, ownerId },
    });
  },

  /**
   * Import contacts with business rules from specs:
   * 1. Ignore duplicates in the same list
   * 2. Validate email format
   */
  importContacts: async (
    emailListId: string,
    contacts: { email: string; name?: string }[],
  ) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validContacts = contacts.filter(
      (c) => c.email && emailRegex.test(c.email),
    );

    if (validContacts.length === 0) return { imported: 0 };

    return await prisma.emailContact.createMany({
      data: validContacts.map((c) => ({
        email: c.email.toLowerCase().trim(),
        name: c.name?.trim() || null,
        emailListId,
      })),
      skipDuplicates: true,
    });
  },

  /**
   * Add a single contact to a list
   */
  addContact: async (emailListId: string, email: string, name?: string) => {
    return await prisma.emailContact.create({
      data: { email, name, emailListId },
    });
  },

  /**
   * Delete a specific contact
   */
  deleteContact: async (contactId: string) => {
    const hasInvitations = await prisma.invitation.findFirst({
      where: { contactId },
    });

    if (hasInvitations) {
      throw new Error("HAS_ASSOCIATED_DATA");
    }

    return await prisma.emailContact.delete({
      where: { id: contactId },
    });
  },

  /**
   * Delete an entire list
   */
  deleteList: async (id: string) => {
    const hasAssociatedData = await prisma.invitation.findFirst({
      where: {
        contact: {
          emailListId: id,
        },
      },
    });

    if (hasAssociatedData) {
      throw new Error("HAS_ASSOCIATED_DATA");
    }

    return await prisma.emailList.delete({
      where: { id },
    });
  },
};
