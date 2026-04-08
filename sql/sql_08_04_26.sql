CREATE TABLE static_networks (
    tempnetworkid INT(11) NOT NULL AUTO_INCREMENT,
    networkname VARCHAR(100),
    lock_status ENUM('Locked','Free') DEFAULT 'Locked',
    locked_at TIMESTAMP NULL DEFAULT NULL,
    released_at TIMESTAMP NULL DEFAULT NULL,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedon TIMESTAMP NULL DEFAULT NULL,
    deletedon TIMESTAMP NULL DEFAULT NULL,
    
    PRIMARY KEY (tempnetworkid)
);