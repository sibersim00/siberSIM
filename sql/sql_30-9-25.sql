CREATE TABLE `custom_scenarios` (
  `custom_scenarioid` int(11) NOT NULL AUTO_INCREMENT,
  `custom_scenariouuid` char(36) NOT NULL DEFAULT 'uuid()',
  `scenariotitle` tinytext NOT NULL,
  `scenarioidentification` varchar(100) NOT NULL,
  `scenariodescription` text DEFAULT NULL,
  `scenariolevel` enum('Esay','Hard','Medium') NOT NULL DEFAULT 'Esay',
  `scenariocategoryid` int(11) NOT NULL,
  `scenariosubcategoryid` int(11) NOT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `learner_id` int(11) DEFAULT NULL,
  `approval_status` enum('Pending','Approve','Reject','Draft') NOT NULL DEFAULT 'Pending',
  `scenarioimage` text DEFAULT NULL,
  `scenariodiagram` longtext DEFAULT NULL,
  `components` longtext DEFAULT NULL,
  `component_config` longtext DEFAULT NULL,
  `network_config` longtext DEFAULT NULL,
  `instruction_file` varchar(255) DEFAULT NULL,
  `duration` bigint(20) DEFAULT NULL,
  `scenariostatus` enum('Draft','Publish') NOT NULL DEFAULT 'Draft',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `reject_reason` text NULL,
  `publishedon` datetime DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`custom_scenarioid`),
  KEY `scenariocategoryid` (`scenariocategoryid`),
  KEY `scenariosubcategoryid` (`scenariosubcategoryid`),
  CONSTRAINT `custom_scenarios_ibfk_1` FOREIGN KEY (`scenariocategoryid`) REFERENCES `scenario_categories` (`scenariocategoryid`),
  CONSTRAINT `custom_scenarios_ibfk_2` FOREIGN KEY (`scenariosubcategoryid`) REFERENCES `scenario_categories` (`scenariocategoryid`)
);
 
ALTER TABLE scenario_categories
ADD COLUMN categorytype ENUM('Public','Private') DEFAULT 'Public' AFTER categoryimage;
 
ALTER TABLE scenarios
ADD COLUMN learner_id int(11) NULL AFTER instructor_id,
ADD COLUMN scenario_type ENUM('Public','Private') DEFAULT 'Public' AFTER learner_id;
 
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
  127,
  NULL,
  'Custom Scenarios',
  'Custom Scenarios',
  'Custom Scenario',
  'Menu',
  '/components/customscenarios',
  '/customscenarios',
  'fa fa-cube',
  5,
  'Active',
  1,
  '2025-04-01 00:00:00',
  1,
  '2025-04-07 16:01:53',
  NULL
);
 
INSERT INTO noti_templates
(template_name, template_action, body, link, payloads, static_payloads, status, createdby)
VALUES
(
  'Scenario Approval',
  'scenario_approval',
  '$$learner_name$$ published a new scenario $$scenariotitle$$. Please review and approve or reject.',
  '',
  '{\"userid\":0,scenarioid,learner_id}',
  NULL,
  'Active',
  1
),
(
  'Scenario Status Notification',
  'scenario_status_notification',
  'Hello $$learner_name$$, your scenario $$scenariotitle$$ has been $$status$$.',
  '',
  '{\"userid\":0,scenarioid,learner_id}',
  NULL,
  'Active',
  1
);
