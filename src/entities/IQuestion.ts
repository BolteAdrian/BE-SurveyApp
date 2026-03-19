import { QuestionType } from "../utils/constants";

export interface IQuestion {
  id: string;
  surveyId: string;
  type: QuestionType;
  title: string;
  required: boolean;
  order: number;
  maxLength?: number; // only for text
  maxSelections?: number; // only for choice
}