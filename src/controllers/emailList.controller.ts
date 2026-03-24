import { Request, Response } from "express";
import { emailListService } from "../services/emailList.service";

/**
 * Controller for email list management
 */
export const emailListController = {
  /**
   * Get a single email list by its ID, including contact count
   * @route GET /email-lists/:id
   */
  getList: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ message: req.t("EMAIL_LIST.FETCH_FAILED") });
      }

      const list = await emailListService.getList(id as string);

      if (!list) {
        return res
          .status(404)
          .json({ message: req.t("EMAIL_LIST.FETCH_FAILED") });
      }

      res.json(list);
    } catch (err) {
      console.error("Error fetching email list:", err);
      res.status(400).json({ message: req.t("EMAIL_LIST.FETCH_FAILED") });
    }
  },

  /**
   * Get all email lists for a specific owner
   * @route GET /email-lists?ownerId=...
   */
  getLists: async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.query; // Can also get from req.user if auth middleware is used
      const lists = await emailListService.getAllLists(ownerId as string);
      res.json(lists); // Return fetched lists
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: req.t("EMAIL_LIST.FETCH_FAILED") });
    }
  },

  /**
   * Create a new email list
   * @route POST /email-lists
   */
  createList: async (req: Request, res: Response) => {
    const { name, ownerId } = req.body;

    // Validate required fields
    if (!name || !ownerId) {
      return res
        .status(400)
        .json({ message: req.t("EMAIL_LIST.CREATE_FAILED") });
    }

    try {
      const newList = await emailListService.createList(name, ownerId);
      res.status(201).json(newList); // Created successfully
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: req.t("EMAIL_LIST.CREATE_FAILED") });
    }
  },

  /**
   * Import contacts into an existing list from CSV/JSON
   * @route POST /email-lists/:listId/import
   */
  importCSV: async (req: Request, res: Response) => {
    const { listId } = req.params;
    const { contacts } = req.body; // Expected array of objects {email, name}

    // Validate contacts format
    if (!contacts || !Array.isArray(contacts)) {
      return res
        .status(400)
        .json({ message: req.t("EMAIL_LIST.IMPORT_INVALID") });
    }

    try {
      await emailListService.importContacts(listId as string, contacts);
      res.json({ message: req.t("EMAIL_LIST.IMPORT_SUCCESS") });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: req.t("EMAIL_LIST.IMPORT_FAILED") });
    }
  },

  /**
   * Delete an email list by ID
   * @route DELETE /email-lists/:id
   */
  deleteList: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await emailListService.deleteList(id as string);
      res.status(204).send();
    } catch (err: any) {
      if (err.message === "HAS_ASSOCIATED_DATA") {
        return res.status(400).json({
          message: req.t("EMAIL_LIST.DELETE_FAILED_HAS_DATA"),
        });
      }
      res.status(400).json({ message: req.t("EMAIL_LIST.DELETE_FAILED") });
    }
  },

  /**
   * Add single contact
   * @route POST /api/lists/:id/contacts
   */
  addContact: async (req: Request, res: Response) => {
    const { email, name } = req.body;
    const { id } = req.params;
    try {
      const contact = await emailListService.addContact(
        id as string,
        email,
        name,
      );
      res.status(201).json(contact);
    } catch (err) {
      res.status(400).json({ message: req.t("EMAIL_LIST.ADD_FAILED") });
    }
  },

  /**
   * Delete contact
   * @route DELETE /api/lists/:id/contacts/:contactId
   */
  deleteContact: async (req: Request, res: Response) => {
    try {
      const { contactId } = req.params;
      await emailListService.deleteContact(contactId as string);
      res.status(204).send();
    } catch (err: any) {
      if (err.message === "HAS_ASSOCIATED_DATA") {
        return res.status(400).json({
          message: req.t("EMAIL_LIST.CONTACT_DELETE_FAILED_HAS_DATA"),
        });
      }
      res
        .status(400)
        .json({ message: req.t("EMAIL_LIST.CONTACT_DELETE_FAILED") });
    }
  },
};
