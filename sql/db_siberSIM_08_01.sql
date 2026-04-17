ALTER TABLE `customer_license`
CHANGE `start_date` `start_date` date NULL COMMENT 'Start Date' AFTER `sim_user_count`,
CHANGE `expiry_date` `expiry_date` date NULL COMMENT 'Expiry Date' AFTER `start_date`;