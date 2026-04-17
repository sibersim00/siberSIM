const api = {
  // auth
  company_list: "/company_setting",
  learner_checklogin: "/learner/checklogin",
  without_otp_verify: "/learner/verifydirectlogin",
  learner_verifylogin: "/learner/verifylogin",
  learner_checkforgot: "/learner/checkforgot",
  learner_verifyforgot: "/learner/verifyforgot",
  learner_register: "/learner/register",
  logout: "/auth/logout",

  // eventLogin

  // auth
  company_list: "/company_setting",
  event_learner_checklogin: "/event/checklogin",
  event_without_otp_verify: "/event/verifydirectlogin",
  event_learner_verifylogin: "/event/verifylogin",
  event_list: "/event/geteventlist",

  scenario_get: "/custom_scenarios/list",
  // dark theme  -
  user_theme: "/commons/theme",

  // dashboard
  dashboard_get: "/dashboard/get",
  running_scenario_get: "/dashboard/scenario-running",
  terminated_scenario_get: "/dashboard/scenario-terminated",
  completed_scenario_get: "/dashboard/scenario-completed",
  get_student_dashboard: "/dashboard/get-student-dashboard",
  scenario_single_custom_get: "/custom_scenarios/get",
  // profile
  profile_get: "/profile",
  changePassword: "/profile/change-password",
  profile_update: "/profile/save-profile",
  profile_image_update: "/profile/save-profile-image",

  // scenarios
  scenarios_get: "/scenarios/get",
  scenarios_get_Pause: "/scenarios/get-paused",
  change_edit_status: "/scenarios/change-edit-status",
  release_edit_lock: "/scenarios/release-edit-lock",
  scenarios_single: "/scenarios/get",
  scenarios_save: "/scenarios/start-scenario",
  scenario_custom_update: "/custom_scenarios/update",
  scenario_custom_getapproved: "/custom_scenarios/getapproved",
  scenario_status_update: "/scenarios/update-session-status",
  get_session_status: "/scenarios/get-session-status",
  get_configurations: "/vmconfigs/set-scenario-learner-config",
  update_completed_terminated: "/vmconfigs/update-complete-terminate",
  pause_scenario: "/vmconfigs/pause-scenario-learner",
  delete_scenario: "/vmconfigs/delete-scenario-learner",
  resume_scenario: "/vmconfigs/resume-scenario-learner",
  vm_start_scenario: "/vmconfigs/start-scenario-learner",
  vm_restart_scenario: "/vmconfigs/restart-scenario-learner",
  custom_scenario_save: "/custom_scenarios/save",
  get_logs: "/scenarios/get-logs",
  scenario_digram_custom_list: "/custom_scenarios/scenariodigramlist",
  tab_status: "/scenarios/list",
  post_Learnerlistbyinstructor: "/scenarios/learnerlistbyinstructor",
  learnersByVmRequest: "/scenarios/getLearnersByVmRequest",
  deleteInviteLearner: "/scenarios/delete-invite-learner",
  save_Invite_Learners:"/scenarios/saveInviteLearners",
  // snapshot
  save_snapshot: "/vmconfigs/create-snapshot",
  get_snapshot: "/vmconfigs/get-snapshots",
  delete_snapshot: "/vmconfigs/delete-snapshot",
  restore_snapshot: "/vmconfigs/restore-snapshot",
  /// chatbox
  chatmessage_get: "/chatbox/getMessages",
  chat_save: "/chatbox/send",
  chat_markseen: "/chatbox/markSeen",
  chat_refresh: "/chatbox/refresh",

  //quiz
  get_all_quiz: "scenario_quiz/getAllLearnerQuiz",
  resume_quiz: "scenario_quiz/resume",
  get_all_quizenario_quiz_details: "/scenario_quiz/get",
  scenario_quiz_save: "/scenario_quiz/save",

  //cookies token for component url
  generate_access_token: "/vmconfigs/generate-access-token",

  // faqs
  faq_get: "/faqs/getfaqs",

  // events
  events_get: "/events/get",
  events_update: "/events/start-event",
  get_event_configurations: "/eventlearner/set-event-learner-config",
  get_event_status: "/events/get-event-status",
  update_completed_event: "/eventlearner/update-complete-event",
  event_status_update: "/events/update-event-status",
  event_chatmessage_get: "/eventchatbox/getMessages",
  event_chat_save: "/eventchatbox/send",
  event_chat_markseen: "/eventchatbox/markSeen",
  event_chat_refresh: "/eventchatbox/refresh",
  event_get_logs: "/events/get-logs",
  event_restart: "/eventlearner/restart-event-learner",
  event_pause: "/eventlearner/pause-scenario-learner",
  event_resume: "/eventlearner/resume-scenario-learner",
  learners_Account_verify: "/learner/verification-success",

  // Notification
  notification_get_template_list: "/notification/get_template_list",
  notification_get_selectors: "/notification/get-selectors",
  notification_savetemplate: "/notification/savetemplate",
  notification_get_noti_list: "/notification/get_noti_list",
  notification_get_noti_list_all: "/notification/get_noti_list_all",
  notification_read_notification: "/notification/read_notification",

  //Scenario Forms dropdown
  scenario_sub_category_list: "/commons/scenariocategorylist",
  scenario_child_category_list: "/commons/scenariosubcategorylist",

  scenario_flowchart_save: "/custom_scenarios/save_diagram",
  master_component_cat_get: "/commons/componentcategorylist",
  scenario_component_by_catId: "/commons/scenariocomponentlist",

  get_details: "/vmconfigs/get",
  save_vmDetails: "vmconfigs/save",
  vm_config: "vmconfigs/vm-config",
  stop_vm: "vmconfigs/stop-vm",
  custom_component_save_learner: "/vmconfigs/savecomponent",
  reject_stopped_vm: "vmconfigs/reject-stopped-vm",

  custom_component_get: "/custom_component/get",
  custom_componentby_id: "/custom_component/getbyid",

  can_resume: "/scenarios/can-resume",
  event_can_resume: "/events/can-resume",
  //-----------Manipulation url----------
  add_network: "vmconfigs/add-vm-network",
  modify_network: "vmconfigs/modify-vm-network",
  delete_network: "vmconfigs/delete-vm-network",
  save_dropped_component: "vmconfigs/add-single-component",
  delete_dropped_component: "vmconfigs/delete-single-network",
  modify_networkId: "vmconfigs/modify-vm-network",
  plug_networPort: "vmconfigs/plug-single-network",
  unplug_networkPort: "vmconfigs/unplug-single-network",
  connect_networkPort: "vmconfigs/connect-single-network",
  disconnect_networkPort: "vmconfigs/disconnect-single-network",
  delete_bridge: "vmconfigs/delete-bridge",

  // --------------invite scenario---------------
  running_invite_learners: "/invitescenarios/running-invite-learners",
  invite_scenario:"/invitescenarios/invite-scenario",
};
export default api;
