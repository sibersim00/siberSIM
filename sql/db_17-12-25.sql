ALTER TABLE `components`
ADD `component_status` enum('Public','Private') COLLATE 'utf8mb4_general_ci' NOT NULL DEFAULT 'Public' COMMENT 'Component status' AFTER `vmid_name`,
CHANGE `network_bridge_name` `network_bridge_name` longtext COLLATE 'utf8mb4_bin' NOT NULL COMMENT 'Network Bridge Name' AFTER `proxmox_json`,
CHANGE `createdon` `createdon` timestamp NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Created On' AFTER `createdby`;


CREATE TABLE customers (
  customerid INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Customer Primary Id',
  customeruuid CHAR(36) NOT NULL COMMENT 'Customer Unique Id',
  firstname VARCHAR(100) NOT NULL COMMENT 'Customer First Name',
  lastname VARCHAR(100) DEFAULT NULL COMMENT 'Customer Last Name',
  email VARCHAR(100) NOT NULL COMMENT 'Customer Email',
  mobile VARCHAR(100) DEFAULT NULL COMMENT 'Customer Mobile Number',
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Current Status',
  createdby INT(11) DEFAULT NULL COMMENT 'CreatedBy ID',
  createdon TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created Date',
  modifiedby INT(11) DEFAULT NULL COMMENT 'ModifiedBy ID',
  modifiedon TIMESTAMP NULL DEFAULT NULL 
    ON UPDATE CURRENT_TIMESTAMP COMMENT 'Modified Date',
  deletedon TIMESTAMP NULL DEFAULT NULL COMMENT 'Deleted Date',
  PRIMARY KEY (customerid),
  UNIQUE KEY uk_customeruuid (customeruuid),
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `scenario_tabs`
ADD `event_status` enum('True','False') COLLATE 'utf8mb4_general_ci' NOT NULL DEFAULT 'True' COMMENT 'Event Status' AFTER `tab_status`;


CREATE TABLE customer_license (
  customer_license_id INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Customer License Id',
  customer_license_uuid CHAR(36) NOT NULL COMMENT 'Customer License Unique ID',
  customer_id INT(11) NOT NULL COMMENT 'Customer ID',
  sim_user_count INT(11) NOT NULL COMMENT 'SIM User Count',
  start_date TIMESTAMP NULL DEFAULT NULL COMMENT 'Start Date',
  expiry_date TIMESTAMP NULL DEFAULT NULL COMMENT 'Expiry Date',
  license_key VARCHAR(255) NOT NULL COMMENT 'License Key',
  domain_url VARCHAR(255) NOT NULL COMMENT 'Domain URL',
  created_by INT(11) DEFAULT NULL COMMENT 'Created by ID',
  created_on TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created date',
  modifiedby INT(11) DEFAULT NULL COMMENT 'Modified by',
  modifiedon TIMESTAMP NULL DEFAULT NULL 
    ON UPDATE CURRENT_TIMESTAMP COMMENT 'Modified On',
  PRIMARY KEY (customer_license_id),
  UNIQUE KEY uk_customer_license_uuid (customer_license_uuid),
  UNIQUE KEY uk_license_key (license_key),
  KEY idx_customer_id (customer_id),
  CONSTRAINT fk_customer_license_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers(customerid)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE custom_component (
  customcomponentid INT(11) NOT NULL AUTO_INCREMENT COMMENT 'custom id',
  customcomponentuuid CHAR(36) NOT NULL COMMENT 'uuid',
  componentname VARCHAR(250) NOT NULL COMMENT 'Component name',
  scenarioid INT(11) NOT NULL COMMENT 'Scenario Id',
  learner_id INT(11) NOT NULL COMMENT 'Learner Id',
  componentcategoryid INT(11) NOT NULL COMMENT 'component category',
  master_vmid INT(11) NOT NULL COMMENT 'Master Vmid',
  clone_vmid INT(11) NOT NULL COMMENT 'clone Vmid',
  vmid INT(11) DEFAULT NULL COMMENT 'vmid',
  componenttype ENUM('LXC','QEMU') DEFAULT 'LXC' COMMENT 'component type',
  duration BIGINT(20) DEFAULT 0 COMMENT 'duration',
  componentimage TEXT DEFAULT NULL COMMENT 'component Image',
  status ENUM('pending','approved','reject') NOT NULL DEFAULT 'pending' COMMENT 'status',
  componentStatus ENUM('Pending','Stop','Start') NOT NULL DEFAULT 'Pending' COMMENT 'Component Status',
  createdby INT(11) DEFAULT NULL COMMENT 'createdby',
  createdon TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'createdon',
  modifiedby INT(11) DEFAULT NULL COMMENT 'modifiedby',
  modifiedon TIMESTAMP NULL DEFAULT NULL
    ON UPDATE CURRENT_TIMESTAMP COMMENT 'modifiedon',
  PRIMARY KEY (customcomponentid),
  UNIQUE KEY uk_customcomponentuuid (customcomponentuuid),
  KEY idx_scenarioid (scenarioid),
  KEY idx_learner_id (learner_id),
  KEY idx_componentcategoryid (componentcategoryid),
  CONSTRAINT fk_custom_component_scenario
    FOREIGN KEY (scenarioid)
    REFERENCES scenarios(scenarioid)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE lab_sessions (
  labid INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary ID',
  labuuid CHAR(36) NOT NULL COMMENT 'Lab Unique Id',
  bookingname VARCHAR(255) NOT NULL COMMENT 'Booking Name',
  datetime DATETIME NOT NULL COMMENT 'Date & Time',
  duration INT(11) NOT NULL COMMENT 'Duration',
  accesslevel ENUM('simManager','simMaster') NOT NULL COMMENT 'Access Level',
  personincharge INT(11) NOT NULL COMMENT 'Person In Charge',
  reservedseats INT(11) NOT NULL COMMENT 'Number of reserved seats',
  allowedusers TEXT DEFAULT NULL COMMENT 'Based on the number of reserved seats selected',
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  createdby INT(11) DEFAULT NULL COMMENT 'Created By ID',
  createdon TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created On',
  modifiedby INT(11) DEFAULT NULL COMMENT 'Modified By ID',
  modifiedon TIMESTAMP NULL DEFAULT NULL
    ON UPDATE CURRENT_TIMESTAMP COMMENT 'Modified On',
  deletedon TIMESTAMP NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (labid),
  UNIQUE KEY uk_labuuid (labuuid),
  KEY idx_datetime (datetime),
  KEY idx_personincharge (personincharge),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE license_logs (
  id INT(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  license_key VARCHAR(255) NOT NULL COMMENT 'License Key',
  createdby INT(11) DEFAULT NULL COMMENT 'Created by ID',
  createdon TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created date',
  PRIMARY KEY (id),
  KEY idx_license_key (license_key),
  KEY idx_createdby (createdby)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE `web_settings`
ADD `component_approval` enum('true','false') COLLATE 'utf8mb4_general_ci' NOT NULL DEFAULT 'true' AFTER `otp_verification`;