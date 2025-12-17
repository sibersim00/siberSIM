const joi = require('joi');

const statusSchema = joi.object({
  status: joi.string().required().messages({
    "string.base": "Status must be a string.",
    "string.empty": "Status cannot be empty.",
    "any.required": "Status is required.",
  }),
  scenarioquestionid: joi.number().required().messages({
    "number.base": "Scenario Question ID must be a number.",
    "number.empty": "Scenario Question ID cannot be empty.",
    "any.required": "Scenario Question ID is required.",
  }),
});
const saveSchema = joi.object({
  scenarioid: joi.number().required().messages({
    "number.base": "Scenario ID must be a number.",
    "any.required": "Scenario ID is required.",
  }),
  question_type: joi.string().valid("SCQ", "MCQ", "Descriptive").required().messages({
    "string.base": "Question Type must be a string.",
    "any.required": "Question Type is required.",
    "any.only": "Question Type must be SCQ, MCQ, or Descriptive.",
  }),
  question_text: joi.string().required().messages({
    "string.base": "Question Text must be a string.",
    "any.required": "Question Text is required.",
  }),
  answersArray: joi.array().min(1).items(
    joi.object({
      answer_text: joi.string().required().messages({
        "string.base": "Answer Text must be a string.",
        "any.required": "Answer Text is required.",
      }),
      is_correct: joi.string()
    .valid("Yes", "No")
    .required()
    .messages({
      "any.only": 'Is Correct must be either "Yes" or "No".',
      "string.base": "Is Correct must be a string.",
      "any.required": "Is Correct is required.",
    }),
    })
  ).required().messages({
    "array.base": "Answers must be an array.",
    "array.min": "At least one answer is required.",
    "any.required": "Answers Array is required.",
  }),
});
const deleteSchema = joi.object({
  scenarioquestionuuid: joi.string().guid({ version: ['uuidv4'] }).required().messages({
    "string.guid": "Scenario Question UUID must be a valid UUID v4.",
    "string.base": "Scenario Question UUID must be a string.",
    "any.required": "Scenario Question UUID is required.",
  }),
});

const messages = {
  fetch_list: 'List fetched successfully.',
  save_success: 'Question saved successfully.',
  update_success: 'Question updated successfully.',
  status_change: 'Status changed successfully.',
  delete_success: 'Question deleted successfully.',
  import_success: 'Questions imported successfully.',
  verify_success: 'Questions verified successfully.',
};

module.exports = {
  statusSchema,
  saveSchema,
  //importScenarioQuestionSchema,
  deleteSchema,
  messages,
};
