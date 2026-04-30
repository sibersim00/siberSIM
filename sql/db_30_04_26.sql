ALTER TABLE web_settings
ADD COLUMN start_network_id INT(11) DEFAULT 1000 AFTER template_clone_vmid,

ADD COLUMN proxmox_current_node VARCHAR(255) DEFAULT 'ofisgate' AFTER max_questions,
ADD COLUMN proxmox_host VARCHAR(255) DEFAULT 'https://battlerangers.com:8006' AFTER proxmox_current_node,
ADD COLUMN proxmox_username VARCHAR(255) DEFAULT 'API@pve' AFTER proxmox_host,
ADD COLUMN proxmox_password VARCHAR(255) DEFAULT 'Sysadmin123@' AFTER proxmox_username,

ADD COLUMN file_server_username VARCHAR(255) NULL AFTER proxmox_password,
ADD COLUMN file_server_password VARCHAR(255) NULL AFTER file_server_username;


CREATE TABLE scenario_failure_log (
    scenario_activity_log_id INT(11) AUTO_INCREMENT PRIMARY KEY,

    scenarioid INT(11) NOT NULL,
    learner_id INT(11) NOT NULL,

    date_time DATETIME NOT NULL,

    createdon TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    modifiedby INT(11) NULL,
    modifiedon TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);