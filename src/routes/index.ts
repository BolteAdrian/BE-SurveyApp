import { Router } from 'express';
import { surveyController } from '../controllers/surveyController';
import { invitationController } from '../controllers/invitationController';
import { resultController } from '../controllers/resultController';
import { publicController } from '../controllers/publicController';
import { trackingController } from '../controllers/trackingController';
import { webhookController } from '../controllers/webhookController';

const router = Router();

/** Admin — Surveys */
router.post('/api/surveys', surveyController.createSurvey);
router.put('/api/surveys/:id', surveyController.updateSurvey);
router.post('/api/surveys/:id/questions', surveyController.addQuestion);
router.put('/api/surveys/:id/questions/:qid', surveyController.updateQuestion);
router.post('/api/surveys/:id/publish', surveyController.publishSurvey);
router.post('/api/surveys/:id/close', surveyController.closeSurvey);

/** Admin — Invitations */
router.post('/api/surveys/:id/invitations/send', invitationController.sendInvitations);
router.get('/api/surveys/:id/invitations', invitationController.listInvitations);
router.get('/api/surveys/:id/invitations/preview', invitationController.previewInvitations);

/** Admin — Results */
router.get('/api/surveys/:id/results/summary', resultController.getSummary);
router.get('/api/surveys/:id/results/questions', resultController.getQuestionStats);
router.get('/api/surveys/:id/results/comments', resultController.getComments);
router.get('/api/surveys/:id/results/export.csv', resultController.exportCsv);

/** Public */
router.get('/s/:slug', publicController.getSurvey);
router.post('/api/public/surveys/:slug/responses', publicController.submitResponse);

/** Tracking */
router.get('/t/open/:token.png', trackingController.emailOpenPixel);

/** Webhooks */
router.post('/webhooks/ses', webhookController.sesWebhook);

export default router;