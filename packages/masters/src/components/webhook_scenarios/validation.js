const joi = require("joi");

const identification = joi
  .string()
  .trim()
  .strict()
  .min(3)
  .max(30)
  .pattern(/^[A-Za-z0-9 _:-]+$/)
  .required()
  .messages({
    "any.required": "Scenario identification is required.",
    "string.empty": "Scenario identification cannot be empty.",
    "string.min": "Scenario identification must contain at least 3 characters.",
    "string.max": "Scenario identification cannot exceed 30 characters.",
    "string.pattern.base":
      "Scenario identification may contain only letters, numbers, spaces, hyphens, underscores, and colons.",
    "string.trim": "Scenario identification cannot contain leading or trailing spaces.",
  });

module.exports = {
  importSchema: joi.object({
    identification,
    scenario_json: joi.any().required().messages({
      "any.required": "Scenario JSON is required.",
    }),
  }),
};
