ALTER TABLE `web_settings`
ADD `proxmox_other_node` text COLLATE 'utf8mb4_general_ci' NULL AFTER `proxmox_current_node`;



ALTER TABLE `vm_request`
ADD `node_name` longtext COLLATE 'utf8mb4_general_ci' NULL AFTER `network_bridges`,
CHANGE `createdon` `createdon` timestamp NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'created On' AFTER `terminatedon`;


ALTER TABLE `web_settings`
CHANGE `start_network_id` `start_network_id` int(11) NOT NULL DEFAULT '1000' COMMENT 'Start network id' AFTER `template_clone_vmid`,
CHANGE `proxmox_other_node` `proxmox_other_node` text COLLATE 'utf8mb4_general_ci' NULL COMMENT 'Proxmox other nodes' AFTER `proxmox_current_node`,
CHANGE `proxmox_host` `proxmox_host` varchar(255) COLLATE 'utf8mb4_general_ci' NOT NULL DEFAULT 'https://battlerangers.com:8006' COMMENT 'Proxmox host' AFTER `proxmox_other_node`,
CHANGE `proxmox_username` `proxmox_username` varchar(255) COLLATE 'utf8mb4_general_ci' NOT NULL DEFAULT 'API@pve' COMMENT 'Proxmox Username' AFTER `proxmox_host`,
CHANGE `proxmox_password` `proxmox_password` varchar(255) COLLATE 'utf8mb4_general_ci' NOT NULL DEFAULT 'Sysadmin123@' COMMENT 'Proxmox Password' AFTER `proxmox_username`,
CHANGE `file_server_username` `file_server_username` varchar(255) COLLATE 'utf8mb4_general_ci' NULL COMMENT 'File server username' AFTER `proxmox_password`,
CHANGE `file_server_password` `file_server_password` varchar(255) COLLATE 'utf8mb4_general_ci' NULL COMMENT 'File server password' AFTER `file_server_username`;


ALTER TABLE `web_settings`
ADD `cluster_task_type` varchar(100) COLLATE 'utf8mb4_general_ci' NULL DEFAULT 'Round Robin' COMMENT 'Cluster method type' AFTER `proxmox_other_node`;


ALTER TABLE `web_settings`
CHANGE `cluster_task_type` `cluster_task_type` varchar(100) COLLATE 'utf8mb4_general_ci' NULL DEFAULT 'RoundRobin' COMMENT 'Cluster method type' AFTER `proxmox_other_node`;



ALTER TABLE `lab_sessions`
ADD `labimage` text NULL COMMENT 'Labs Image' AFTER `reservedseats`;