CREATE TABLE `scenario_tabs` (
  `scenariotabid` int(11) NOT NULL COMMENT 'Primary Id' AUTO_INCREMENT PRIMARY KEY,
  `scenariotabuuid` char(36) NOT NULL COMMENT 'uuid',
  `tab_name` varchar(100) NOT NULL COMMENT 'Tab Name',
  `tab_status` enum('True','False') NOT NULL DEFAULT 'True' COMMENT 'Tab Status',
  `tab_type` enum('Fixed','Flexible') NOT NULL DEFAULT 'Fixed' COMMENT 'Tab Type',
  `tab_ordering` int(11) NOT NULL COMMENT 'Tab Ordering',
  `createdon` timestamp NULL,
  `modifiedon` timestamp NULL,
  `deletedon` timestamp NULL
);


UPDATE `ad_menus` SET
`menuid` = '129',
`parentmenuid` = '11',
`menuname` = 'Scenario Tab Configuration',
`displaymenuname` = 'Scenario Tab Configuration',
`singularmenuname` = 'Scenario Tab Configuration',
`menutype` = 1,
`menupath` = '/components/masters/masters/scenariotabs',
`source` = '/scenariotabs',
`icon` = 'ti ti-home',
`orderno` = '520',
`status` = 1,
`createdby` = NULL,
`createdon` = NULL,
`modifiedby` = NULL,
`modifiedon` = NULL,
`deletedon` = NULL
WHERE `menuid` = '129';


ALTER TABLE `scenario_tabs`
DROP `scenariotabuuid`;

ALTER TABLE `scenario_tabs`
ADD `widget_url` varchar(255) COLLATE 'utf8mb4_general_ci' NULL AFTER `tab_type`;
