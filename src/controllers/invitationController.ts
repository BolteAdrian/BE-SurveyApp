import { Request, Response } from "express";
import { invitationService } from "../services/invitationService";

/**
 * Controller for survey invitations (admin)
 */
export const invitationController = {
  /**
   * Send invitations to a contact list (skip duplicates)
   * @route POST /surveys/:id/invitations/send
   */
  sendInvitations: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { listId } = req.body;

    if (!id || !listId) {
      return res.status(400).json({
        error: req.t("INVITATION.SEND_FAILED"),
      });
    }

    try {
      const result = await invitationService.sendInvitations(
        id as string,
        listId,
      );
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("INVITATION.SEND_FAILED"),
      });
    }
  },

  /**
   * List invitations with pagination and search
   * @route GET /surveys/:id/invitations
   */
  listInvitations: async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const q = String(req.query.q || "");

    if (!id) {
      return res.status(400).json({
        error: req.t("INVITATION.LIST_FAILED"),
      });
    }

    try {
      const invitations = await invitationService.listInvitations(
        id as string,
        page,
        q,
      );
      res.status(200).json(invitations);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("INVITATION.LIST_FAILED"),
      });
    }
  },

  /**
   * Generate a quick test link without sending an email
   * @route POST /surveys/:id/invitations/quick-link
   */
  generateQuickLink: async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validation: Check if survey ID is provided
    if (!id) {
      return res.status(400).json({
        error: "Survey ID is required to generate a test link.",
      });
    }

    try {
      // Call the service to create the invitation and get the URL
      const result = await invitationService.generateQuickLink(id as string);

      // Return the generated URL to the frontend
      res.status(200).json(result);
    } catch (err) {
      console.error("Quick Link Error:", err);
      res.status(500).json({
        error:
          "Failed to generate quick link. Make sure the survey is PUBLISHED.",
      });
    }
  },

  /**
   * Preview invitations before sending
   * @route GET /surveys/:id/invitations/preview?list_id={lid}
   */
  previewInvitations: async (req: Request, res: Response) => {
    const { id } = req.params;
    const listId = String(req.query.list_id);

    if (!id || !listId) {
      return res.status(400).json({
        error: req.t("INVITATION.PREVIEW_FAILED"),
      });
    }

    try {
      const preview = await invitationService.previewInvitations(
        id as string,
        listId,
      );
      res.status(200).json(preview);
    } catch (err) {
      console.error(err);
      res.status(403).json({
        error: req.t("INVITATION.PREVIEW_FAILED"),
      });
    }
  },
};
