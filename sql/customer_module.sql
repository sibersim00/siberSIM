INSERT INTO `ad_roles` (`rolename`, `displayname`, `description`, `status`)
VALUES ('License Ops', 'License Ops', 'License Ops', 1);

INSERT INTO `ad_menus` (`parentmenuid`, `menuname`, `displaymenuname`, `singularmenuname`, `menutype`, `menupath`, `source`, `icon`, `orderno`, `status`) VALUES
(NULL,	'Customers',	'Customers',	'Customers',	'Menu',	'/components/customers',	'/customers',	'fa fa-cubes',	5,	'Active');