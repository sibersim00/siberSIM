DROP TABLE IF EXISTS `scenario_import_components`;
CREATE TABLE `scenario_import_components` (
  `imp_comp_id` int(11) NOT NULL AUTO_INCREMENT,
  `componentid` int(11) DEFAULT NULL,
  `importid` int(11) NOT NULL,
  `vm_file` varchar(500) DEFAULT NULL,
  `status` enum('pending','transferring','uploaded','failed') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `uploaded` tinyint(1) DEFAULT 0,
  `uploadedon` timestamp NULL DEFAULT NULL,
  `createdon` datetime DEFAULT current_timestamp(),
  `modifiedon` datetime DEFAULT NULL,
  PRIMARY KEY (`imp_comp_id`)
);


DROP TABLE IF EXISTS `scenario_import`;
CREATE TABLE `scenario_import` (
  `importid` int(11) NOT NULL AUTO_INCREMENT,
  `scenariotitle` varchar(255) DEFAULT NULL,
  `scenarioidentification` varchar(100) DEFAULT NULL,
  `userid` int(11) DEFAULT NULL,
  `original_scenarioid` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `message` text DEFAULT NULL,
  `zip_path` text DEFAULT NULL,
  `extract_path` text DEFAULT NULL,
  `createdon` datetime DEFAULT current_timestamp(),
  `modifiedon` datetime DEFAULT NULL,
  `deletedon` datetime DEFAULT NULL,
  PRIMARY KEY (`importid`)
);



DROP TABLE IF EXISTS `scenario_export`;
CREATE TABLE `scenario_export` (
  `exportid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'scenario export Id',
  `scenarioid` int(11) NOT NULL COMMENT 'scenarioid',
  `userid` int(11) DEFAULT NULL COMMENT 'user id',
  `learner_id` int(11) DEFAULT NULL COMMENT 'learner id',
  `status` enum('Inprogress','Failed','Running','Complete') DEFAULT 'Inprogress' COMMENT 'Status',
  `file_name` varchar(255) DEFAULT NULL COMMENT 'File name',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'createdon',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'modifiedon',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'deletedon',
  PRIMARY KEY (`exportid`)
);


DROP TABLE IF EXISTS `component_export`;
CREATE TABLE `component_export` (
  `componentexportid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'component export Id',
  `componentid` int(11) NOT NULL COMMENT 'component Id',
  `exportid` int(11) DEFAULT NULL COMMENT 'export id',
  `vmid` int(11) NOT NULL COMMENT 'vmid',
  `scenarioid` int(11) DEFAULT NULL COMMENT 'Scenario ID',
  `upid` varchar(255) DEFAULT NULL COMMENT 'Upid',
  `file_name` varchar(255) DEFAULT NULL COMMENT 'File name',
  `status` enum('Pending','Failed','Running','Completed') DEFAULT 'Pending' COMMENT 'status',
  `reject_reason` varchar(255) DEFAULT NULL COMMENT 'Reject Reason',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'createdon',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'modifiedon',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'deletedon',
  PRIMARY KEY (`componentexportid`)
);