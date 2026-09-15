ALTER TABLE `ad_users`
CHANGE `usertype` `usertype` enum('Admin','Instructor','WebhookUser') COLLATE 'utf8mb4_general_ci' NULL DEFAULT 'Admin' COMMENT 'User Type' AFTER `password`;






INSERT INTO `ad_menus` (
  `menuid`,
  `parentmenuid`,
  `menuname`,
  `displaymenuname`,
  `singularmenuname`,
  `menutype`,
  `menupath`,
  `source`,
  `icon`,
  `orderno`,
  `status`,
  `createdby`,
  `createdon`,
  `modifiedby`,
  `modifiedon`,
  `deletedon`
) VALUES (
  141,
  NULL,
  '	Webhook Users',
  '	Webhook Users',
  '	Webhook User',
  'Menu',
  '/components/users/webhookuser',
  '/webhookuser',
  'fa fa-cube',
  "2.30",
  'Active',
  1,
  '2025-04-01 00:00:00',
  1,
  '2025-04-07 16:01:53',
  NULL
);


CREATE TABLE IF NOT EXISTS `webhook_access_tokens` (
  `webhook_token_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `webhook_user_id` INT NOT NULL,
  `jti` CHAR(36) NOT NULL,
  `issuedon` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expireson` TIMESTAMP NULL DEFAULT NULL,
  `revokedon` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`webhook_token_id`),
  UNIQUE KEY `uq_webhook_access_tokens_jti` (`jti`),
  KEY `idx_webhook_access_tokens_user_active` (`webhook_user_id`, `revokedon`, `expireson`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

CREATE TABLE IF NOT EXISTS `webhook_api_logs` (
  `webhook_log_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `request_uuid` CHAR(36) NOT NULL,
  `webhook_user_id` INT NULL,
  `username` VARCHAR(100) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `http_method` VARCHAR(10) NOT NULL,
  `endpoint` VARCHAR(500) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `learner_uuid` CHAR(36) NULL,
  `response_status` SMALLINT UNSIGNED NOT NULL,
  `response_time_ms` INT UNSIGNED NULL,
  `error_message` VARCHAR(500) NULL,
  `createdon` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`webhook_log_id`),
  KEY `idx_webhook_api_logs_user_created` (`webhook_user_id`, `createdon`),
  KEY `idx_webhook_api_logs_request_uuid` (`request_uuid`),
  KEY `idx_webhook_api_logs_status_created` (`response_status`, `createdon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


ALTER TABLE `learners`
  ADD COLUMN `ambient_motion` TINYINT(1) NOT NULL DEFAULT 1
  COMMENT 'Learner scenario ambient motion preference'
  AFTER `theme_preference`;
