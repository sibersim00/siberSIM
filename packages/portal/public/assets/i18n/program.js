const title_program = "Program";
const course  = "Course" ;
const lesson = "Lesson"
const description = "Description"
export const program_es = {
  "program" : title_program,
  "overview" : "Overview",
  "configure" : "Configure",
  "new_program" : "New" +" "+ title_program,
  "titel" : "Title",
  "published_swal_text" : "Do you really want to published this program ?",
  "overview_no_program_msg" : {
    "oh_no" : "Ohh no!",
    "msg" : "No programs to display. Add some programs."
  },
  "program_columndef" : {
    "title" : "Title",
    "category" : "Category",
    "start_date" : "Start Date",
    "end_date" : "End Date",
    "action" : "Action",
    "level" : "Level",
    "tutor_name" : "Tutor Name",
    "program_status" : "Program Status"
  },

  "tab_name" : {
    "basic_information" : "Basic Information",
    "media_documents" : "Media & Documents",
    "eligibility_key_features" : "Eligibility & Key Features",
    "learning_path" : "Learning path",
    "faq" : "FAQ",
    "schedules" : "Schedules",
    "seo" : "SEO",
    "confirm_submit" : "Confirm & Submit"
  },

  "basic_info" : {
    "label" : {
        "title" : "Title",
        "display_title" : "Display Title",
        "subtitle" : "Subtitle",
        "category" : "Category",
        "other_categoryname" : "Other Category Name",
        "description" : description,
        "brief_description" : "Brief Description",
        "skills" : "Skills",
        "tools" : "Tools",
        "level" : "Level",
        "is_free" : "Is Free",
        "price" : "Price",
        "enrollment_start_date" : "Enrollment Start Date",
        "enrollment_end_date" : "Enrollment End Date",
        "course_start_date" : "Course Start Date",
        "course_end_date" : "Course End Date", 
        "slug" : "Slug"
    },
    "placeholder" : {
        "title" : "Enter title",
        "display_title" : "Enter display title",
        "subtitle" : "Enter subtitle",
        "category" : "Select category",
        "other_categoryname" : "Enter other category name" ,
        "description" : "Enter description",
        "skills" : "Select skills",
        "tools" : "Select tools",
        "level" : "Select level",
        "price" : "Enter price",
        "enrollment_start_date" : "Select enrollment start date",
        "enrollment_end_date" : "Select enrollment end date",
        "course_start_date" : "Select course start date",
        "course_end_date" : "Select course end date" 

    },
    "tooltip" : {
        "title" : "Unique program name",
        "display_title" : "Program display name on website",
        "other_categoryname" : "The name of the temporary category that will be replaced with a valid category.",
        "description" : "A short description of the program (up to 255 characters).",
        "brief_description" : "An overall description of the program with all required information (This info. will display on website)"
    }
  },

  "media_document" : {
    "label" : {
      "banner" : "Banner",
      "syllabus" : "Syllabus",
      "is_certified" : "Is Certified",
      "demo_certificate" : "Certificate Format",
      "video_url" : "Video URL"
    },
    "placeholder" : {
      
    },
    "tooltip" : {
      "banner" : "Upload Banner",
      "syllabus" : "Upload Program Syllabus",
      "demo_certificate" : "Upload your dummy certificate here, and it will be displayed on the website.",
      "video_url" : "Enter vimeo / youtube video URL"
    }
  },
  
  "eligibility" : {
    "eligibility_criteria" : "Eligibility Criteria",
    "label" : "Enter Criteria",
    "placeholder" : "Enter criteria",
    "tooltip" : "Add Criteria",
    "no_criteria_added_msg" : "No eligibility criteria added yet"
  },

  "key_feature" : {
    "key_feature" : "Key Features",
    "tooltip" : "Add Features",
    "no_key_feature_msg" : "No key features are added yet",
    "label" : {
      "title" : "Enter Title",
      "description" : "Enter Description"
    },
    "placeholder" : {
      "title" : "Enter title",
      "description" : "Enter description"
    }
  },

  "learning_path" : {
    "course_lesson" : course + " "+ lesson,
    "no_lessons_add_msg": "No lessons are added yet",
    "label" : {
      "lesson_title" : lesson + " " + "Title",
      "lesson_description" : lesson + " " + "Description",
      "video_url" : "Video URL",
      "duration" : "Duration",
      "lesson_document" : "Lesson Document"
    },
    "placeholder" : {
      "lesson_title" : "Enter lesson title",
      "video_url" : "Enter video URL",
      "duration" : "Enter duration"
    }, 
    "swal" :{
      "delete_lesson" : "Do you really want to delete lesson?"
    }
  },

  "schedule" : {
    "delete_swal_text" : "Do you really want to delete session?",
    "program_schedule" : "Program Schedule" ,
    "program_schedules" : "Program Schedules",
    "calculate" : "Calculate",
    "schedule_slots" : "Schedule Slots",
    "sessions" : "Sessions",
    "total":"Total",
    "to" : "To",
    "invalid_days_for_custom_recurrence" : "Invalid days for custom recurrence",
    "time_interval_is_mandatory" : "Time interval is mandatory",
    "no_schedule_added" : "No Schedules has been added yet",
    "note" : {
      "note" : "Note",
      "text1": "Always schedule program between course start date",
      "text2" : "& end date"
    },
    "label" : {
      "start_time" : "Start Time" ,
      "end_time" : "End Time",
      "start_date" : "Start Date",
      "end_date" : "End Date",
      "occurance" : "Occurance",
      "select_days" : "Select Days"
    },
    "placeholder" : {
      "start_time" : "Select start time" ,
      "end_time" : "Select end time",
      "start_date" : "Select start date",
      "end_date" : "Select end date",
      "occurance" : "Select",
    }
  },

  "seo" : {
    "label" : {
        "title" : "Title",
        "description" : description,
        "keywords" : "Keywords", 
        "og_title" : "Og Title",
        "og_description" : "Og Description" ,
        "meta_image" : "Image",
        "meta_og_image" : "Og Image"
    },
    "placeholder" : {
        "title" : "Enter title",
        "description" : "Enter description",
        "keywords" : "Enter keywords", 
        "og_title" : "Enter og title",
        "og_description" : "Enter og description"  
    },
    "tooltip" : {
        "title" : "",
        "description" : "",
        "keywords" : "", 
        "og_title" : "",
        "og_description" : "",
    }
  },

  "confirm_submit" : {
    "tools_covered" : "Tools Covered",
    "skills_covered" : "Skills Covered",
    "description" : description,
    "subtitle" : "Sub-Title",
    "other" : "Other",
    "title" : "Title",
    "learning_path" : "Learning Path",
    "schedules" : "Program Schedules",
    "save_draft" : "Save Draft",
    "confirm_submit" : "Confirm & Submit",
    "activitylog" : "Activity logs",
    "reject" : "Reject",
    "approve" : "Approve",
    "category_alert" : {
      "text1" : "Please update your",
      "text2" : "selected category",
      "text3" : "to a valid option to proceed. If you don't find your category in the dropdown, no worries! Feel free to contact our support team or administrator."
    },
    "tooltip" : {
      "complete" : "Complete",
      "faq_required" : "FAQ is required.",
      "learning_path_required" : "Learning path is required.",
      "key_feature" : "Key Features are required.",
      "course_start_date":"Course Start Date",
      "course_end_date" : "Course End Date",
      "category" : "Category",
      "level" : "Level",
      "schedule_required" :  "Program Schedules is required."
    },
    "swal" : {
      "save_as_draft_test" : "Do you really want to save as draft this program?",
      "submit_prgm_title" : "Are you sure to submit program?",
      "html" : {
        "text1" : "Your submission will undergo a comprehensive review by our administration team. We'll notify you once the approval process is complete.",
        "text2" : "(You will not be able to modify it until any action is taken by the administration.)"
      },
      "yes_submit_it":"Yes, submit it!",
      "approve_program": "Do you really want to approve program ?"
    },
    "remark" : {
      "header" : "Are you sure ?",
      "label" : "Enter rejection remarks",
      "placeholder" : "Enter remarks"
    }
  },

  "view" : {
    "heading" : "Program Overview",
    "enrollments" : "Enrollments",
    "negotiation_logs" : "Negotiation Logs"
  },

  "negotiation" : {
    "title1" : "Program Price",
    "title2" : "Tutor Commission",
    "error" : "Amount should not be greater than Base Amount",
    "label" : {
      "final_price" : "Total Amount",
      "gst_rate" : "GST Rate",
      "gst_amount" : "GST Amount",
      "base_amount" : "Base Amount",
      "percentage" : "Percentage",
      "amount" : "Amount",
      "remark" : "Comment",
      "tutor_commision" : "Tutor Commision",
      "commision_rate" : "Commision Rate"
    },

    "placeholder" : {
      "final_price" : "Enter total amount",
      "gst_rate" : "Enter GST",
      "percentage" : "Enter percentage",
      "amount" : "Enter amount",
      "remark" : "Enter comment"
    },
    "buttons" : {
      "negotiate" : "Negotiate",
    },
    "note" : {
      "program_display_amount_will_be" : "Program display amount will be",
      "tutor_commission_amount_will_be" : "Tutor commission amount will be",
      "tds_will_be_deducted_from" : "10 % TDS will be deducted from",
      "commission" : "commission"
    }
  }

}
  