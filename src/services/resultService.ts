/**
 * Service for survey results
 */
export const resultService = {
  /**
   * Summary funnel: invited → sent → email opened → survey opened → submitted → bounced
   */
  getSummary: async (surveyId: string) => {
    return {
      invited: 0,
      sent: 0,
      emailOpened: 0,
      surveyOpened: 0,
      submitted: 0,
      bounced: 0,
    }; // placeholder
  },

  /**
   * Question statistics: count + % per option
   */
  getQuestionStats: async (surveyId: string) => {
    return []; // placeholder
  },

  /**
   * Get text comments with pagination
   */
  getComments: async (surveyId: string, page = 1, query = '', questionId?: string) => {
    return []; // placeholder
  },
};