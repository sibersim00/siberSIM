const Joi = require("joi");

const getMessagesByEventSchema = Joi.object({
  eventlearnerid: Joi.number().required().messages({
    "any.required": "eventlearnerid is required",
    "number.base": "eventlearnerid must be a number",
  }),
});

const refreshByEventSchema = Joi.object({
  eventlearnerid: Joi.number().required().messages({
    "any.required": "eventlearnerid is required",
    "number.base": "eventlearnerid must be a number",
  }),
  eventlearnerchatid: Joi.number().required().messages({
    "any.required": "eventlearnerchatid is required",
    "number.base": "eventlearnerchatid must be a number",
  }),
});

const sendMessageSchema = Joi.object({
  eventlearnerid: Joi.number().required(),
  eventid: Joi.number().required(),
  message: Joi.string().required().messages({
    "any.required": "Message is required",
    "string.base": "Message must be a string",
  }),
  attachment: Joi.string().uri().allow(null, "").optional(),
});

const markMessagesSeenSchema = Joi.object({
  eventid: Joi.number().required().messages({
    "any.required": "eventid is required",
    "number.base": "eventid must be a number",
  }),
  learner_id: Joi.number().required().messages({
    "any.required": "learner_id is required",
    "number.base": "learner_id must be a number",
  }),
  instructor_id: Joi.number().required().messages({
    "any.required": "instructor_id is required",
    "number.base": "instructor_id must be a number",
  }),
});



const messages = {
  // Generic
  server_error: "Server error. Please try again later.",
  success: "Success.",

  // Messaging: getMessagesByEvent
  fetch_messages_success: "Messages fetched successfully.",
  fetch_messages_error: "Failed to fetch messages.",

  // Messaging: refreshByEvent
  refresh_messages_success: "Messages refreshed successfully.",
  refresh_messages_error: "Failed to refresh messages.",

  // Messaging: sendMessage
  message_send_success: "Message sent successfully.",
  message_send_error: "Failed to send message.",

  // Messaging: markMessagesSeen
  messages_seen_success: "Messages marked as seen.",
  messages_seen_error: "Failed to mark messages as seen.",
};

module.exports = {
  getMessagesByEventSchema,
  refreshByEventSchema,
  sendMessageSchema,
  markMessagesSeenSchema,
  messages,
};
