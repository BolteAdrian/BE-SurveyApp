import { QuestionType } from "../utils/constants";
import { IOption } from "./IOption";

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

export interface IQuestionWithOptions extends IQuestion {
  options: IOption[];
}