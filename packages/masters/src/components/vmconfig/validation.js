const Joi = require("joi");

const updateCompleteTerminate = Joi.object({
  status: Joi.string().valid("Completed", "Terminated").required().messages({
    "any.only": `Status must be either 'Completed' or 'Terminated'.`,
    "any.required": `Status is required.`,
    "string.empty": `Status cannot be empty.`,
  }),
});


const ERROR_MESSAGES = {
   CONFIG_NOT_FOUND: "Component configuration not found.",
  LEARNER_NOT_FOUND: "SIMUser data not found.",
  NETWORK_BRIDGES: "Not enough available network bridges.",
  COM_TYPE_NOT_FOUND: "Component Type not found.",
  PREVIOUS_NETWORK: "Failed to resolve previously assigned network bridge.",
  NO_COMPONENTS_FOR_STATUS: "No components found for the given status.",
  MISSING_TARGET_VMID: "Component is missing target VMID.",
  MISSING_MASTER_VMID: "Component is missing master VMID.",
  CLONE_FAILED: "Clone failed for component.",
  CONFIGURATION_FAILED: "Configuration failed for component.",
  START_FAILED: "Start failed for component.",
  CONFIGURATION_ERROR: "Error during component configuration.",
  START_ERROR: "Error during VM start.",
  UNHANDLED_SETUP_ERROR: "Unhandled error during component setup.",
  UNHANDLED_CONFIGURE_ERROR: "Unhandled error during component configuration.",
  UNHANDLED_START_ERROR: "Unhandled error during component start.",
  FAILURE_MARKED: "Marking all components and session as 'Failed'.",
  CONFIG_SUCCESS: "Set Configurations Successfully.",
};


module.exports = {
  updateCompleteTerminate,
  ERROR_MESSAGES
};
