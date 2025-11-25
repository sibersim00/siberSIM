CREATE TABLE `snapshot_details` (
  `snapshotid` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'SnapShot ID',
  `master_vmid` INT(11) DEFAULT NULL COMMENT 'Master Vmid',
  `vmid` INT(11) DEFAULT NULL COMMENT 'Clone Vmid',
  `learner_id` INT(11) DEFAULT NULL COMMENT 'Learner Id',
  `scenarioid` INT(11) DEFAULT NULL COMMENT 'Scenario Id',
  `component_type` ENUM('LXC','QEMU') DEFAULT 'LXC' COMMENT 'Component Type',
  `snapshot_name` VARCHAR(255) NOT NULL COMMENT 'Snapshot Name',
  `snapshot_status` ENUM('Capture','Restore','Delete') DEFAULT 'Capture' COMMENT 'Snapshot Status',
  `createdon` TIMESTAMP NULL DEFAULT NULL COMMENT 'Created date tIme',
  `deletedon` TIMESTAMP NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`snapshotid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;