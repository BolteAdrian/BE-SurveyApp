import { Request, Response } from 'express';
import { invitationService } from '../services/invitationService';

/**
 * Controller for survey invitations (admin)
 */
export const invitationController = {
  /**
   * Send invitations to a contact list (skip duplicates)
   * POST /api/surveys/:id/invitations/send
   */
  sendInvitations: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { listId } = req.body;
    const result = await invitationService.sendInvitations(id as string, listId);
    res.json(result);
  },

  /**
   * List invitations with pagination and search
   * GET /api/surveys/:id/invitations
   */
  listInvitations: async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const q = String(req.query.q || '');
    const invitations = await invitationService.listInvitations(id as string, page, q);
    res.json(invitations);
  },

  /**
   * Preview invitations before sending
   * GET /api/surveys/:id/invitations/preview?list_id={lid}
   */
  previewInvitations: async (req: Request, res: Response) => {
    const { id } = req.params;
    const listId = String(req.query.list_id);
    const preview = await invitationService.previewInvitations(id as string, listId);
    res.json(preview);
  },
};