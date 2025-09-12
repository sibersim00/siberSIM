let title = "Mail Configuration";

export const mail_config_en = {
  "title": title,
  "tabs" : {
    "overview" : "Overview",
    "action_templates" : "Action Templates",
    "configure_template" : "Configure Template",
    "shortcodes" : "Shortcodes",
  },
  "overview": {
    "title": "Activity",
    "forms": {
      "title": "Create Workflow",
      "label": {
        "sender_name": "Sender Name",
        "template_name": "Template Name",
        "email_id" : "Email Id",
        "status": "Status",
      },
      "placeholder": {
        "sender_name": "Select sender name",
        "template_name": "Select template name",
        "email_id"  : "Enter email id",
      },
    },
    "tooltip":{
      "add_workflow" : "Add Workflow",
      "workflows_not_found" : "Workflows Not Found",
    }
  },
  "action_template" : {
    "title": "Action",
    'columns' : {
        "template_name": "Template Name",
        "subject" : "Subject",
        "status" : "Status",
        "action" : "Action"
      },
  },
  "configure_template": {
    "forms": {
      "label": {
        "name": "Name",
        "subject": "Subject",
        "body": "Body",
        "to": "To",
        "cc": "Cc",
        "bcc": "Bcc",
        "ckeditor": "CKEditor",
        "grapejs": "GrapesJS",
        "body_required" : "Body Required",
      },
    }
  },
    "shortcodes" : {
      "title": "Mail Shortcodes",
      'columns' : {
          "display_name": "Display Name",
          "selector_name" : "Selector Name",
          "description" : "Description",
          "status" : "Status"
        },
    },

};
