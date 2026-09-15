const joi = require('joi');
const emojiRegex = /[\p{Extended_Pictographic}]/u;
const categoryNameSchema = joi.string().trim().required().pattern(emojiRegex, { invert: true }).messages({
    "string.base": "Scenario subcategory should be a string",
    "string.empty": "Scenario subcategory cannot be empty",
    "any.required": "Scenario subcategory is required",
    "string.pattern.invert.base": "Scenario subcategory name cannot contain emojis.",
});
const idSchema = joi.string().required().messages({
    "string.base": "Invalid Request: Scenario category ID must be a string",
    "string.empty": "Invalid Request: Scenario category ID must not be empty",
    "any.required": "Invalid Request: Scenario category ID is required",
});
const saveSchema = joi.object({
    categoryname: categoryNameSchema,
    parentscenariocategoryid: joi.number().strict().optional().messages({
        "number.base": "Parent scenario category ID should be a number",
        "any.required": "Parent scenario category is required",
    })
});
const updateSchema = joi.object({
    categoryname: categoryNameSchema,
    parentscenariocategoryid: joi.number().strict().optional().messages({
        "number.base": "Parent scenario category ID should be a number",
        "any.required": "Parent scenario category is required",
    }),
        scenariocategoryid: joi.number().integer().required().messages({
        "number.base": "Scenario category ID should be an integer",
        "number.empty": "Scenario category ID cannot be empty",
        "any.required": "Scenario category ID is required",
    }),
});
const deleteSchema = joi.object({
    scenariocategoryid: joi.number().integer().required().messages({
        "number.base": "Scenario category ID should be an integer",
        "number.empty": "Scenario category ID cannot be empty",
        "any.required": "Scenario category ID is required",
    }),
});
const importSchema = joi.array().items(
    joi.object({
      parentscenariocategoryid: joi.alternatives()
        .try(joi.string().trim(), joi.number().integer())
        .required()
        .messages({
          'any.required': 'Parent category is required.'
        })
    })
  );

const messages = {
    'save_success': "Record has been created successfully.",
    'update_success': "Record has been updated successfully.",
    'something_wrong_try_later': "Something went wrong. Please try again later.",
    'category_name_duplicate': "Record already exists.",
    'status_not_change': "Unable to change status.",
    'status_change': "Status changed successfully.",
    'server_error': "Server error",
    'id_exist': "Unable to change status, ID already exists",
    'category_already_mapped': "Record already mapped with subcategories",
    'delete_success': "Record has been deleted successfully",
    'import_success': "Record has been imported successfully.",
};
module.exports = {
    idSchema,
    saveSchema,
    updateSchema,
    deleteSchema,
    importSchema,
    messages,
};
