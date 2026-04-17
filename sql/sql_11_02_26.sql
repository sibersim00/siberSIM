ALTER TABLE `vm_request`
ADD `isedit` enum('true','false') COLLATE 'utf8mb4_general_ci' NULL DEFAULT 'false' COMMENT 'Is Edit' AFTER `isnotitermination`,
CHANGE `createdon` `createdon` timestamp NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'created On' AFTER `terminatedon`;


ALTER TABLE `vm_request`
ADD `edit_by` int(11) NULL COMMENT 'Edit by' AFTER `isedit`,
CHANGE `createdon` `createdon` timestamp NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'created On' AFTER `terminatedon`;

ALTER TABLE `web_settings`
CHANGE `component_approval` `component_approval` enum('true','false') COLLATE 'utf8mb4_general_ci' NOT NULL DEFAULT 'true' COMMENT 'Component Approval' AFTER `otp_verification`,
ADD `scenario_approval` enum('true','false') COLLATE 'utf8mb4_general_ci' NOT NULL DEFAULT 'true' COMMENT 'Scenario Approval' AFTER `component_approval`;


ALTER TABLE `vm_config`
CHANGE `network_bridge_json` `network_bridge_json` text COLLATE 'utf8mb4_general_ci' NULL AFTER `duration`;

ALTER TABLE scenarios
ADD COLUMN manipulation_flag ENUM('true','false') DEFAULT 'false' AFTER publishedon;


ALTER TABLE customer_license
ADD COLUMN manipulation_flag ENUM('True','False') DEFAULT 'False' AFTER domain_url;


CREATE TABLE `invite_learner` (
  `invitelearnerid` int(11) NOT NULL COMMENT 'Invite learner primary key' AUTO_INCREMENT PRIMARY KEY,
  `vmrequestid` int(11) NOT NULL COMMENT 'vm request id',
  `learnerid` int(11) NOT NULL COMMENT 'learner id',
  `createdon` timestamp NULL,
  `modifiedon` timestamp NULL,
  `deletedon` timestamp NULL
);