const api = {
  // ---login -----------------
  company_list: "/company_setting",
  without_otp_verify: "/verifydirectlogin",
  verifylogin: "/verifylogin",
  checklogin: "/checklogin",
  orglist: "/orglist",
  logout: "/auth/logout",
  // ---forgot-password -------
  verifyforgot: "/verifyforgot",
  checkforgot: "/checkforgot",
  //---instructor login Forgot SignUp Verfication--------------
  without_otp_verify_inst: "/instructor/verifydirectlogin",
  instructor_verifylogin: "/instructor/verifylogin",
  instructor_checklogin: "/instructor/checklogin",
  instructor_orglist: "/instructor/orglist",
  instructor_verifyforgot: "/instructor/verifyforgot",
  instructor_checkforgot: "/instructor/checkforgot",
  instructor_verifyByID: "/instructor/verification-success",
  instructor_signup: "/instructor/register",

  // ---access-permission-menu -----------------
  menus_list: "/roleaccess/menus/list",
  menus_parentlist: "/roleaccess/menus/parentlist",
  master_rolelist: "/roleaccess/master/rolelist",
  menus: "/roleaccess/menus",
  menus_status: "/roleaccess/menus/status",
  menus_getmenu: "/roleaccess/menus/getmenu",
  // ---access-permission-organization ---------------
  org_list: "/roleaccess/org/list",
  org: "/roleaccess/org",
  org_status: "/roleaccess/org/status",
  // ---access-permission-role -----------------
  roles_list: "/roleaccess/roles/list",
  roles_upsert: "/roleaccess/roles/upsert",
  roles_status: "/roleaccess/roles/status",
  roles_viewrolemenus: "/roleaccess/roles/viewrolemenus",
  roles_storerolemenus: "/roleaccess/roles/storerolemenus",
  // ---access-permission-role-permission -----------------
  roles_getusers: "/roleaccess/roles/getusers",
  roles_getrolelist: "/roleaccess/roles/getrolelist",
  roles_userrolemap: "/roleaccess/roles/userrolemap",
  roles_userrolerights: "/roleaccess/roles/userrolerights",
  roles_userrolemap: "/roleaccess/roles/userrolemap",
  // ---access-permission-user -----------------
  users_list: "/roleaccess/users/list",
  org_list: "/roleaccess/org/list",
  users: "/roleaccess/users",
  users_status: "/roleaccess/users/status",
  users_update: "/roleaccess/users/update",
  users_reset: "/roleaccess/users/reset-password",

  // ---common-masters -----------------
  commons_countrieslist: "/commons/countrieslist",
  commons_citieslist: "/commons/citieslist",
  commons_stateslist: "/commons/stateslist",
  commons_departmentlist: "/commons/departmentlist",
  commons_banklist: "/commons/banklist",

  // ---mailconfig-overview-----------------
  masters_getemail_configs: "/masters/get-email-configs",
  masters_get_activities: "/masters/get-activities",
  masters_get_activity_actions: "/masters/get-activity-actions",
  masters_get_email_senders: "/masters/get-email-senders",
  workflows_save: "/workflows/save",
  templates_test_email: "/templates/test-email",
  // ---mailconfig-action-templates-----------------
  masters_get_actions: "/masters/get-actions",
  templates_action_templates: "/templates/action-templates",
  // ---mailconfig-configure-template-----------------
  masters_get_selectors: "/masters/get-selectors",
  templates_get: "/templates/get",
  masters_get_actions: "/masters/get-actions",
  templates_save: "/templates/save",
  // ---mailconfig-placeholder-----------------
  selectors_get: "/selectors/get",


  // ---Learner-manage-----------------
  learners_get: "/learners/get",
  learners_change_status: "/learners/change-status",

  // --- System Config -----
  sc_types: "/systemconfigapi/sc_types",
  sc_submit: "/systemconfigapi/sc_submit",
  sc_update_status: "/systemconfigapi/sc_update_status",
  sc_users_submit: "/systemconfigapi/sc_users_submit",
  sc_email_user: "/systemconfigapi/sc_email_user",
  sc_user_update_status: "/systemconfigapi/sc_user_update_status",
  sc_types_defaultupdate: "/systemconfigapi/sc_types_defaultupdate",
  sc_testemail: "/systemconfigapi/sc_testemail",

  // --- Categories -----
  categories_get: "/categories/get",
  categories_save: "/categories/save",
  categories: "/categories",
  category_faqs_get: "/category-faqs/get",
  category_faqs_save: "/category-faqs/save",
  category_faqs: "/category-faqs",

  // -----Notifications---------
  notification_get_template_list: "/notification/get_template_list",
  notification_get_selectors: "/notification/get-selectors",
  notification_savetemplate: "/notification/savetemplate",
  notification_get_noti_list: "/notification/get_noti_list",
  notification_get_noti_list_all: "/notification/get_noti_list_all",
  notification_read_notification: "/notification/read_notification",

  //------Web Setting-------------
  footer_setting: "/web-settings/get_web_footer",
  web_setting: "/web-settings/get_web_settings",
  add_web_setting: "/web-settings/add-web-setting",
  updated_web_setting: "/web-settings/update-web-setting",
  add_web_footer: "/web-settings/add-web-footer",
  updated_web_footer: "/web-settings/update-web-footer",
  change_status_footer: "/web-settings/change-status-footer",
  upload_logo: "/web-settings/upload-logo",

  // -----------Learner register
  learners_import: "/learners/import",
  learners_save: "/learners/save",
  learners_update: "/learners/update",
  learners_reset: "/learners/reset-password",
  learners_confirmation: "/learners/mail_confirmation",
  learners_Account_verify: "/learner/verification-success",

  tutor_save: "/tutors/save",
  instructors_import: "/tutors/import",

  // ----------- Profile --------------
  change_password: "/roleaccess/users/change-password",
  change_profile: "/roleaccess/users/save-profile",
  get_profile: "/roleaccess/users/get-profile",
  users_import: "/roleaccess/users/import",
  user_image: "/roleaccess/users/save-profile-image",


  // ----------- Dashboard -----------------
  get_dashoard: "/dashboard/dashboardstats",
  event_dashboard: "/eventdashboard/dashboardstats",
  event_list: "/eventdashboard/getEventList",

  // exam_publish_status: "/exams/publish-exam",

  scorm_zip: "/upload_scorm",

  // ---component Sub Categories -----
  component_categories_get: "/component-category/list",
  component_categories_change_status: "/component-category/status",
  component_categories_delete: "/component-category/delete",
  component_categories_save: "/component-category/save",
  component_categories_update: "/component-category/update",
  component_categories_verify: "/component-category/verify",
  component_categories_import: "/component-category/import",

  // ---component Sub Categories -----
  component_subcategories_get: "/component-subcategory/list",
  component_subcategories_change_status: "/component-subcategory/status",
  component_subcategories_delete: "/component-subcategory/delete",
  component_subcategories_save: "/component-subcategory/save",
  component_subcategories_single: "/component-subcategory/get",
  component_subcategories_update: "/component-subcategory/update",

  //--------Scenario-------------
  scenario_get: "/scenario/list",
  scenario_custom_get: "/custom_scenarios/list_custom",
  scenario_change_status: "/scenario/status",
  scenario_save: "/scenario/save",
  scenario_update: "/scenario/update",
  scenario_custom_update: "/custom_scenarios/update",
  scenario_delete: "/scenario/delete",
  scenario_single: "/scenario/get",
  // scenario_custom_single: "/scenario/get",
  scenario_single_custom_get: "/custom_scenarios/get",
  scenario_digram_list: "/scenario/scenariodigramlist",
  scenario_digram_custom_list: "/custom_scenarios/scenariodigramlist",
  save_component_config: "/scenario/savecomponentconfiguration",
  // custom config
  save_component_custom_config: "/custom_scenarios/savecomponentconfiguration",
  scenario_export_zip: "/scenario/export_selected_scenarios",
  scenario_import_zip: "/scenario/import_scenario_zip",

  // --- Scenario sub  Categories -----

  scenario_subcategories_get: "/scenario-subcategories/get",
  scenario_subcategories_save: "/scenario-subcategories/save",
  scenario_subcategories_update: '/scenario-subcategories/update',
  scenario_subcategories_delete: "/scenario-subcategories/delete",
  scenario_subcategories_status: "/scenario-subcategories/change-status",
  scenario_subcategories_verify: "/scenario-subcategories/verify",
  scenario_subcategories_import: "/scenario-subcategories/import",

  // --- master api for component Scenario Categories -----
  scenario_sub_category_list: "/commons/scenariocategorylist",
  scenario_child_category_list: "/commons/scenariosubcategorylist",


  scenario_sub_category_custom_list: "/commons/scenariocategorycustomlist",
  scenario_child_category_custom_list: "/commons/scenariosubcategorycustomlist",
  scenario_instructor_list: "/commons/instructorlist",

  //-----master api for component
  master_component_cat_get: "commons/componentcategorylist",
  master_component_subcat_get: "commons/componentsubcategorylist",


  // ---components -----
  component_get: "/components/get",
  component_change_status: "/components/change-status",
  component_delete: "/components/delete",
  component_save: "/components/save",
  component_update: "/components/update",
  component_single: "/components/getbyid",
  component_subcategory_list: "/components/get-vms",
  component_subcategory_VMDetail: "/components/vm-details",

  //networkss
  fetch_network: "/network/fetch-network",
  fetch_network_list: "/network/list",


  fetch_apilogs_list: "/apilogs/get-logs",
  fetch_apilogs_by_id: "/apilogs/get-logs",

  // ----batches-----
  batches_get: "/batches/get",
  batches_delete: "/batches/delete",
  batches_student_get: "/commons/studentlistevent",
  batches_list: "/commons/batchlist",
  batches_update: "/batches/update",
  batches_save: "/batches/save",
  batches_status: "/batches/change-status",
  batch_single: "/batches/get",
  batches_student_get: "/commons/studentlistevent",
  student_getlist: "/commons/studentlist",

  //----Instructors Manage------
  instructor_get: "/instructors/get",
  instructor_getbyid: "/instructors/get",
  instructor_save: "/instructors/save",
  instructor_update: "/instructors/update",
  instructor_change_status: "/instructors/change-status",
  instructor_verify: "/instructors/send-verification",
  instructor_reset: "/instructors/reset-password",

  // ---normalusers/ students-manage-----------------
  normalusers_get: "/learners/get",
  normalusers_change_status: "/learners/change-status",
  normalusers_save: "/learners/save",
  normalusers_update: "/learners/update",
  normalusers_delete: "/learners/delete",
  normalusers_getbyid: "/learners/get",
  //---------------------flowchart------------------
  scenario_flowchart_get: "/commons/getactivescenariodiagram",
  scenario_flowchart_save: "/scenario/save_diagram",
  scenario_custom_flowchart_save: "/custom_scenarios/save_diagram",

  // --- Scenario Categories -----
  scenario_categories_get: "/scenario-categories/get",
  scenario_categories_save: "/scenario-categories/save",
  scenario_categories_update: '/scenario-categories/update',
  scenario_categories_delete: "/scenario-categories/delete",
  scenario_categories_status: "/scenario-categories/change-status",
  scenario_categories_verify: "/scenario-categories/verify",
  scenario_categories_import: "/scenario-categories/import",

  //-----master api for components by category
  master_component_by_catId: "/commons/componentlistbycategory",
  scenario_component_by_catId: "/commons/scenariocomponentlist",
  //------------to save instructo student mapping
  save_mapped_instructor: "/learners/save-mapped-instructor",
  getmapped_instructorList_byId: '/learners/getmapped-instructorList',

  //--------------common api for scenario list
  common_scenario_get: "commons/scenariolist",
  common_instructor_get: "commons/scenarioinstructorlist",

  //-------------assign scenario to batch/students
  assign_scenario: "/assign_scenario/save",
  assign_scenario_get: "/assign_scenario/list",
  assign_scenario_getbyId: "/assign_scenario/get",
 
  // dark theme 
  user_theme: "/commons/theme",


  ///--------------usersessionlist

  usersession_list: "/usersession/list",
  termination_save: "/usersession/terminate-scenario-instructor",
  notification_send: "/usersession/noti-termination",
  termination_send: "/vmconfig/update-complete-terminate",
  terminated: "/usersession/terminate",
  usersession_getbyId: "/usersession/get",
  get_logs: "/usersession/get-logs",
  termination_Failed_Scenario: "/vmconfig/cleanup-operation-failed",
  termination_Failed_Logs: "/vmconfig/get-operation-failed-logs",
   termination_Failed_Events: "/vmconfig/cleanup-operation-failed-events",
   termination_Failed_Events_logs: "/vmconfig/get-event-operation-failed-logs",
  //----------chatbox for instructor
  chatmessage_get: "/chatbox/getMessages",
  chat_save: "/chatbox/send",
  chat_markseen: "/chatbox/markSeen",
  chat_refresh: "/chatbox/refresh",

  // chatbox for event dashboard screen 
  event_chatmessage_get: "/eventchatbox/getMessages",
  event_chat_save: "/eventchatbox/send",
  event_chat_markseen: "/eventchatbox/markSeen",
  event_chat_refresh: "/eventchatbox/refresh",

  // Scenario chatbox
  //-------------------for scenario Quiz
  quiz_getAll: "/scenario_questions/get",
  quiz_save: "scenario_questions/save",
  status_change: "scenario_questions/status_change",
  veriefy_import_quiz: "scenario_questions/scenario_questions_verify",
  import_quiz: "scenario_questions/scenario_questions_import",
  delete_quiz: "/scenario_questions/delete",

  //Event 
  //------------------------------------event listing
  event_getAll: "/event/get",
  event_addparticipants: "/event/addParticipants",
  event_addLearnerEvent: "/event/addLearnerEvent",
  event_listparticipant: "/event/fetchLearnersByEvent",
  event_removeLearnerFromEvent: "/event/removeLearnerFromEvent",
  event_updateLearnerFromEvent: "/event/updateParticipant",

  event_save: "/event/save",
  event_update: "/event/update",
  event_scenario: "/commons/getallscenario",

  // ------------------api Faq-------------
  faq_get: "/commons/faqlist",

  // --------faqs masters-----,
  faq_getall: "/faqs/get",
  faq_save: "/faqs/save",
  faq_update: "/faqs/update",
  faq_delete: "/faqs/delete",
  faq_get_by_id: "/faqs/get/",
  faq_change_status: "/faqs/change-status",
  faq_verify: "/faqs/verify",
  faq_import: "faqs/import",



  //----------Widgets -------------
  widget_getall: "/widgets/get",
  widget_save: "/widgets/save",
  widget_update: "/widgets/update",
  widget_delete: "/widgets/delete",
  widget_change_status: "/widgets/change-status",
  //----------Reports---------------

  admin_logs: "report/loginlogs/admins",
  instructor_logs: "report/loginlogs/instructors",
  user_logs: "report/loginlogs/learners",



  user_reports_list: "/user-reports/get-learner-details",
  user_performance_list: "/user-reports/get-learner-statistics",
  instructor_reports_list: "/instructor-reports/get-instructor-details",
  instructor_performance_list: "/instructor-reports/get-instructor-statistics",


  /// export import web-setting

  // export_masters: "/company_setting/export_masters",
  // import_masters: "/company_setting/import_masters",

  export_masters: "/company_setting/export_masters",
  export_scenarios: "/company_setting/export_scenarios",
  import_masters: "/company_setting/import_masters",


  // start and restart

  vm_start_scenario: "/usersession/start-scenario-learner",
	vm_restart_scenario: "/usersession/restart-scenario-learner",





};




export default api;