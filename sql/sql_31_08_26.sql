CREATE TABLE IF NOT EXISTS `learner_third_party_integrations` (
  `integration_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary ID',
  `learner_id` int(11) NOT NULL COMMENT 'Owning learner',
  `integration_name` varchar(150) NOT NULL COMMENT 'External application name',
  `integration_url` varchar(2048) NOT NULL COMMENT 'External application URL',
  `description` varchar(500) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `createdon` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedon` timestamp NULL DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`integration_id`)
)