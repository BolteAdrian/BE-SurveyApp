import { Router } from 'express';
import authRoutes from './authRoutes';
import { surveyController } from '../controllers/surveyController';
import { invitationController } from '../controllers/invitationController';
import { resultController } from '../controllers/resultController';
import { publicController } from '../controllers/publicController';
import { trackingController } from '../controllers/trackingController';
import { webhookController } from '../controllers/webhookController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Auth routes
router.use(authRoutes);

/** Admin — Surveys */
router.get('/api/surveys', authenticate, surveyController.getSurveys);
router.get('/api/surveys/:id', authenticate, surveyController.getSurvey);
router.post('/api/surveys', authenticate, surveyController.createSurvey);
router.put('/api/surveys/:id', authenticate, surveyController.updateSurvey);
router.get('/api/surveys/:id/questions/:qid', authenticate, surveyController.getQuestion);
router.post('/api/surveys/:id/questions', authenticate, surveyController.addQuestion);
router.put('/api/surveys/:id/questions/:qid', authenticate, surveyController.updateQuestion);
router.post('/api/surveys/:id/publish', authenticate, surveyController.publishSurvey);
router.post('/api/surveys/:id/close', authenticate, surveyController.closeSurvey);
router.delete('/api/surveys/:id', authenticate, surveyController.deleteSurvey);
router.delete('/api/surveys/:id/questions/:qid', authenticate, surveyController.deleteQuestion);

/** Admin — Invitations */
router.post('/api/surveys/:id/invitations/send', authenticate, invitationController.sendInvitations);
router.get('/api/surveys/:id/invitations', authenticate, invitationController.listInvitations);
router.get('/api/surveys/:id/invitations/preview', authenticate, invitationController.previewInvitations);

/** Admin — Results */
router.get('/api/surveys/:id/results/summary', authenticate, resultController.getSummary);
router.get('/api/surveys/:id/results/questions', authenticate, resultController.getQuestionStats);
router.get('/api/surveys/:id/results/comments', authenticate, resultController.getComments);
router.get('/api/surveys/:id/results/export.csv', authenticate, resultController.exportCsv);

/** Public */
router.get('/s/:slug', publicController.getSurvey);
router.post('/api/public/surveys/:slug/responses', publicController.submitResponse);

/** Tracking */
router.get('/t/open/:token.png', trackingController.emailOpenPixel);

/** Webhooks */
router.post('/webhooks/ses', webhookController.sesWebhook);

export default router;