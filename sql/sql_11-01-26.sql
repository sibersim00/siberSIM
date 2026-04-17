ALTER TABLE `license_logs`
ADD `status` enum('Active,','Expired,','New') COLLATE 'utf8mb4_general_ci' NULL DEFAULT 'New' COMMENT 'Key Status' AFTER `license_key`;