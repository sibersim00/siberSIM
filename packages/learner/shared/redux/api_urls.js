const api = {
	// auth
	company_list: "/company_setting",
	learner_checklogin: "/learner/checklogin",
	without_otp_verify: "/learner/verifydirectlogin",
	learner_verifylogin: "/learner/verifylogin",
	learner_checkforgot: "/learner/checkforgot",
	learner_verifyforgot: "/learner/verifyforgot",
	learner_register: "/learner/register",
	logout : "/auth/logout",

	// eventLogin

	// auth
	company_list: "/company_setting",
	event_learner_checklogin: "/event/checklogin",
	event_without_otp_verify: "/event/verifydirectlogin",
	event_learner_verifylogin: "/event/verifylogin",
	event_list: "/event/geteventlist",


	// dark theme  - 
	user_theme: "/commons/theme",

	// dashboard
	dashboard_get: "/dashboard/get",
	running_scenario_get: "/dashboard/scenario-running",
	terminated_scenario_get: "/dashboard/scenario-terminated",
	completed_scenario_get: "/dashboard/scenario-completed",
	get_student_dashboard: "/dashboard/get-student-dashboard",

	// profile
	profile_get: "/profile",
	changePassword: "/profile/change-password",
	profile_update: "/profile/save-profile",
	profile_image_update: "/profile/save-profile-image",

	// scenarios
	scenarios_get: "/scenarios/get",
	scenarios_single: "/scenarios/get",
	scenarios_save: "/scenarios/start-scenario",
	scenario_status_update: "/scenarios/update-session-status",
	get_session_status: "/scenarios/get-session-status",
	get_configurations: "/vmconfigs/set-scenario-learner-config",
	update_completed_terminated: "/vmconfigs/update-complete-terminate",
	vm_start_scenario: "/vmconfigs/start-scenario-learner",
	vm_restart_scenario: "/vmconfigs/restart-scenario-learner",
	get_logs: "/scenarios/get-logs",

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
	learners_Account_verify: "/learner/verification-success",

	// Notification
	notification_get_template_list: "/notification/get_template_list",
	notification_get_selectors: "/notification/get-selectors",
	notification_savetemplate: "/notification/savetemplate",
	notification_get_noti_list: "/notification/get_noti_list",
	notification_get_noti_list_all: "/notification/get_noti_list_all",
	notification_read_notification: "/notification/read_notification",


	vnc_proxy_console:"/vmconfigs/vnc-proxy-console",
};
export default api;