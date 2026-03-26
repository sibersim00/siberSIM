CREATE TABLE invite_learner (
    invitelearnerid INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Invite learner primary key',
    vmrequestid INT(11) NOT NULL COMMENT 'vm request id',
    learnerid INT(11) NOT NULL COMMENT 'learner id',
    invited_by_learner_id INT(11) DEFAULT NULL COMMENT 'invited by learner id',
    createdon TIMESTAMP NULL DEFAULT NULL,
    modifiedon TIMESTAMP NULL DEFAULT NULL,
    deletedon TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (invitelearnerid)
);

INSERT INTO `ad_menus` (
  `menuid`,
  `parentmenuid`,
  `menuname`,
  `displaymenuname`,
  `singularmenuname`,
  `menutype`,
  `menupath`,
  `source`,
  `icon`,
  `orderno`,
  `status`,
  `createdby`,
  `createdon`,
  `modifiedby`,
  `modifiedon`,
  `deletedon`
) VALUES (
  139,
  NULL,
  'Running Components',
  'Running Components',
  'Running Components',
  'Menu',
  '/components/running_components',
  '/running_components',
  'ti ti-key',
  1007,
  'Active',
  1,
  NULL,
  1,
  NULL,
  NULL
);