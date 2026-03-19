import { SurveyStatus } from "../utils/constants";

export interface ISurvey {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  slug: string;
  status: SurveyStatus;
  createdAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
}
