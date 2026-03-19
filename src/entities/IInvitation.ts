import { IResponse } from './IResponse';

export interface IInvitation {
  id: string;
  surveyId: string;
  contactId: string;
  tokenHash: string;
  sentAt: Date;
  emailOpenedAt?: Date | null;   // pixel tracking
  surveyOpenedAt?: Date | null;  // first time survey page is opened
  submittedAt: Date | null;     // first submit
  bouncedAt: Date | null;       // bounce SES
  response?: IResponse | null;
}
