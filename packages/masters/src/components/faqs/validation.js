const Joi = require('joi');

// Common order_by and type validation for save & update
const orderByTypeSchema = Joi.object({
  order_by: Joi.number().integer().optional(),
  type: Joi.string().trim().optional(),
});

const saveSchema = Joi.object({
  question: Joi.string().trim().required(),
  answer: Joi.string().trim().required(),
  order_by: Joi.number().integer().optional(),
  status: Joi.string().valid('Active', 'Inactive').optional(),
  type: Joi.string().trim().optional(),
});

const updateSchema = Joi.object({
  faq_id: Joi.number().integer().required(),
  question: Joi.string().trim().required(),
  answer: Joi.string().trim().required(),
  order_by: Joi.number().integer().optional(),
  status: Joi.string().valid('Active', 'Inactive').optional(),
  type: Joi.string().trim().optional(),
});

const deleteSchema = Joi.object({
  faq_id: Joi.number().integer().required(),
});

const statusChangeSchema = Joi.object({
  faq_id: Joi.number().integer().required(),
  status: Joi.string().valid('true', 'false').required(),
});

const faqVerifySchema = Joi.array().items(
  Joi.object({
    faq_id: Joi.number().integer().optional(),
    question: Joi.string().trim().required(),
    answer: Joi.string().trim().required(),
    order_by: Joi.number().integer().optional(),
    type: Joi.string().trim().optional(),
  })
);

const faqImportSchema = Joi.array().items(
  Joi.object({
    faq_id: Joi.number().integer().optional(),
    question: Joi.string().trim().required(),
    answer: Joi.string().trim().required(),
    order_by: Joi.number().integer().optional(),
    type: Joi.string().trim().optional(),
  })
);

const messages = {
    'save_success': "FAQ saved successfully",
    'update_success': "FAQ has been updated successfully.",
    'something_wrong_try_later': "Something went wrong. Please try again later.",
    'category_name_duplicate': "FAQ already exists.",
    'status_not_change': "Unable to change status.",
    'status_change': "Status changed successfully.",
    'server_error': "Server error",
    'id_exist': "Unable to change status, ID already exists",
    'delete_success': "FAQ has been deleted successfully",
    'import_success': "FAQ has been imported successfully.",
    'question_duplicate': "This FAQ already exists.",
    'order_by_duplicate': "Order already exists for this type.",

};
module.exports = {
    orderByTypeSchema,
    saveSchema,
    updateSchema,
    deleteSchema,
    statusChangeSchema,
    faqVerifySchema,
    faqImportSchema,
    messages,
};
