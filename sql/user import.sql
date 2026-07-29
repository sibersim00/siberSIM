ALTER TABLE `learners`
ADD `is_password_reset` enum('True','False') COLLATE 'latin1_swedish_ci' NOT NULL DEFAULT 'False' COMMENT 'Forget password flag' AFTER `status`;