-- Adminer 4.8.1 MySQL 10.4.24-MariaDB-log dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DELIMITER ;;

DROP FUNCTION IF EXISTS `getEmailActions`;;
CREATE FUNCTION `getEmailActions`(p_id int
) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'id',action_id,
            'action',action,
            'displayname',displayname,
            'payloads',payloads,
            'static_payloads',static_payloads,
            'status',status
            )SEPARATOR ','),']') AS result FROM email_actions);
    ELSE
        SET p_response =  (SELECT JSON_OBJECT(
            'id',action_id,
            'action',action,
            'displayname',displayname,
            'payloads',payloads,
            'static_payloads',static_payloads,
            'status',status
            ) AS result FROM email_actions WHERE action_id = p_id);        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `getEmailConfigurations`;;
CREATE FUNCTION `getEmailConfigurations`(`p_id` int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'configid',nec.config_id,
            'actionname',nea.action_name, 
            'emailname',nec.email_name,
            'description',nec.description,
            'to_email_ids',nec.to_email_ids,
            'cc_email_ids',nec.cc_email_ids,
            'subject',nec.subject,
            'body',nec.body,
            'sender_email_id',nec.sender_email_id,
            'attachments',nec.attachments,  
            'status',nec.status
            )SEPARATOR ','),']') AS result FROM notification_email_config nec
    LEFT JOIN notification_email_action nea ON nea.action_id = nec.action_id
    WHERE nec.status= 'Active');
    ELSE
        SET p_response =  (SELECT JSON_OBJECT(
            'configid',nec.config_id,
            'actionname',nea.action_name,
            'emailname',nec.email_name,
            'description',nec.description,
            'to_email_ids',nec.to_email_ids,
            'cc_email_ids',nec.cc_email_ids,
            'subject',nec.subject,
            'body',nec.body,
            'sender_email_id',nec.sender_email_id,
            'attachments',nec.attachments,  
            'status',nec.status
            ) AS result FROM notification_email_config nec
    LEFT JOIN notification_email_action nea ON nec.action_id = nea.action_id WHERE nec.config_id = p_id);        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `getEmailSelectors`;;
CREATE FUNCTION `getEmailSelectors`(p_id int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'id',selector_id,
            'display_name',display_name,
            'selector_name',selector_name,
            'selector_query',selector_query,
            'selector_keys',selector_keys,
            'description',description,
            'status',status,
            'key_type',key_type
            )SEPARATOR ','),']') AS result FROM email_selectors);
    ELSE
        SET p_response =  (SELECT JSON_OBJECT(
            'id',selector_id,
            'display_name',display_name,
            'selector_name',selector_name,
            'selector_query',selector_query,
            'selector_keys',selector_keys,
            'description',description,
            'status',status,
            'key_type',key_type
            ) AS result FROM email_selectors WHERE selector_id = p_id);        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `getEmailTemplates`;;
CREATE FUNCTION `getEmailTemplates`(p_id int,p_action_id int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_action_id IS NOT NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'id',template_id,
            'template_name',template_name,
            'subject',subject,
            'body',body,
            'to_email_ids',to_email_ids,
            'cc_email_ids',cc_email_ids,    
            'bcc_email_ids',bcc_email_ids, 
            'action_id',action_id,
            'payloads',payloads,
            'editor',editor,
            'status',status
            )SEPARATOR ','),']') AS result FROM email_templates WHERE action_id = p_action_id);
    ELSEIF p_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'id',template_id,
            'template_name',template_name,
            'subject',subject,
            'body',body,
            'to_email_ids',to_email_ids,
            'cc_email_ids',cc_email_ids,    
            'bcc_email_ids',bcc_email_ids,        
            'action_id',action_id,
            'payloads',payloads,
            'editor',editor,
            'status',status
            )SEPARATOR ','),']') AS result FROM email_templates);
    ELSE
        SET p_response =  (SELECT JSON_OBJECT(
            'id',template_id,
            'template_name',template_name,
            'subject',subject,
            'body',body,
            'to_email_ids',to_email_ids,
            'cc_email_ids',cc_email_ids,
            'bcc_email_ids',bcc_email_ids,
            'action_id',action_id,
            'payloads',payloads,
            'editor',editor,
            'status',status
            ) AS result FROM email_templates WHERE template_id = p_id);        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `getEmailWorkflows`;;
CREATE FUNCTION `getEmailWorkflows`(p_id int,p_action_id int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_action_id IS NOT NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'id',workflow_id,
            'template_id',template_id,
            'mailuser_id',mailuser_id, 
            'action_id',action_id,
            'status',status
            )SEPARATOR ','),']') AS result FROM email_workflows WHERE action_id = p_action_id);
    ELSEIF p_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'id',workflow_id,
            'template_id',template_id,
            'mailuser_id',mailuser_id, 
            'action_id',action_id,
            'status',status
            )SEPARATOR ','),']') AS result FROM email_workflows);
    ELSE
        SET p_response =  (SELECT JSON_OBJECT(
            'id',workflow_id,
            'template_id',template_id,
            'mailuser_id',mailuser_id, 
            'action_id',action_id,
            'status',status
            ) AS result FROM email_workflows WHERE workflow_id = p_id);        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `getMenus`;;
CREATE FUNCTION `getMenus`(`p_id` int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'menuid',m.menuid,
            'menuname',m.menuname,
            'displaymenuname',m.displaymenuname,
            'singularmenuname',m.singularmenuname,
            'icon',m.icon,
            'menupath',m.menupath,
            'menutype',m.menutype,
            'source',m.source,
            'parentmenuid',m.parentmenuid,
            'orderno',m.orderno,
            'parentmenuname',mm.menuname,
            'status',case when m.status = 'Active' then 'true' else 'false' end 
            ) order by m.menuid asc SEPARATOR ','),']') AS result FROM ad_menus m left join ad_menus mm on m.parentmenuid=mm.menuid where m.deletedon is null);
    ELSE
        SET p_response =  (SELECT JSON_OBJECT(
            'menuid',m.menuid,
            'menuname',m.menuname,
            'displaymenuname',m.displaymenuname,
            'singularmenuname',m.singularmenuname,
            'icon',m.icon,
            'menupath',m.menupath,
            'menutype',m.menutype,
            'source',m.source,
            'parentmenuid',m.parentmenuid,
            'orderno',m.orderno,
            'parentmenuname',mm.menuname,
            'status',case when m.status = 'Active' then 'true' else 'false' end
            ) AS result FROM ad_menus m left join ad_menus mm on m.parentmenuid=mm.menuid WHERE m.menuid = p_id);        
    END IF;

    RETURN p_response;
end;;

DROP FUNCTION IF EXISTS `getOrganizations`;;
CREATE FUNCTION `getOrganizations`(`p_org_id` int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_org_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'orgid',orgid,
            'orgcode',orgcode,
            'orgname',orgname,
            'status',case when status = 'Active' then 'true' else 'false' end
            )SEPARATOR ','),']') AS result FROM ad_organizations  WHERE deletedon is null);
    ELSE
        SET p_response =  (SELECT JSON_OBJECT(
            'orgid',orgid,
            'orgcode',orgcode,
            'orgname',orgname,
            'status',case when status = 'Active' then 'true' else 'false' end
            ) AS result FROM ad_organizations WHERE orgid = p_org_id);        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `getRoles`;;
CREATE FUNCTION `getRoles`(p_id int
) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'roleid',roleid,
            'rolename',rolename,
            'displayname',displayname,
            'description',description,
            'status',CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END
            ) order by roleid asc SEPARATOR ','),']') AS result FROM ad_roles where deletedon is null);
    ELSE
        SET p_response =  (SELECT JSON_OBJECT(
            'roleid',roleid,
            'rolename',rolename,
            'displayname',displayname,
            'description',description,
            'status',CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END
            ) AS result FROM ad_roles WHERE roleid = p_id);        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `getUsers`;;
CREATE FUNCTION `getUsers`(`p_id` int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_response JSON;

    IF p_id IS NULL THEN
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'userid',m.userid,
            'orgid',m.orgid,
            'loginid',m.loginid,
            'name',CONCAT(m.firstname, ' ', m.lastname),
            'firstname',m.firstname,
            'lastname',m.lastname,
            'email',m.email,
            'mobile',m.mobile,
            'status',case when m.status = 'Active' then 'true' else 'false' end 
            ) order by m.userid asc SEPARATOR ','),']') AS result FROM ad_users m where m.deletedon is null);
    ELSE
        SET p_response =  (SELECT CONCAT('[',GROUP_CONCAT(JSON_OBJECT(
            'userid',m.userid,
            'orgid',m.orgid,
            'loginid',m.loginid,
            'name',CONCAT(m.firstname, ' ', m.lastname),
            'firstname',m.firstname,
            'lastname',m.lastname,
            'email',m.email,
            'mobile',m.mobile,
            'status',case when m.status = 'Active' then 'true' else 'false' end 
            ) order by m.userid asc SEPARATOR ','),']') AS result FROM ad_users m where m.userid = p_id);        
    END IF;

    RETURN p_response;
end;;

DROP FUNCTION IF EXISTS `saveEmailActions`;;
CREATE FUNCTION `saveEmailActions`(`p_input` json) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_id INT;
    DECLARE p_action VARCHAR(255);
    DECLARE p_displayname VARCHAR(255);
    DECLARE p_status VARCHAR(255);
    DECLARE p_isdefault VARCHAR(255);
    DECLARE p_payloads TEXT;
    DECLARE p_static_payloads TEXT;
    DECLARE p_response JSON;

    -- Extract values from JSON
    SET p_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.id'));
    SET p_action = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.action'));
    SET p_displayname = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.displayname'));
    SET p_status = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.status'));
    SET p_payloads = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.payloads'));
    SET p_static_payloads = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.static_payloads'));

    -- Check if the Email Actions already exists
    IF EXISTS (SELECT 1 FROM email_actions WHERE action_id = p_id) THEN

        IF EXISTS (SELECT 1 FROM email_actions WHERE action_id != p_id AND action = p_action) THEN
            SET p_response = JSON_OBJECT('statusCode',500,'message','Action Already Exists');
        ELSE
            -- Update existing Email Actions
            UPDATE email_actions
            SET
                action = p_action,
                displayname = p_displayname,
                status = p_status,
                payloads = p_payloads,
                static_payloads = p_static_payloads,
                modifiedon = now()
            WHERE
                action_id = p_id;

            SET p_response = JSON_OBJECT('statusCode',200,'message','Email Action updated successfully');
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM email_actions WHERE action = p_action) THEN
            SET p_response = JSON_OBJECT('statusCode',500,'message','Action Already Exists');
        ELSE
            -- Insert new Email Actions
            INSERT INTO email_actions (
                action,
                displayname,
                status,
                payloads,
                static_payloads,
                createdon
            ) VALUES (
                p_action,
                p_displayname,
                p_status,
                p_payloads,
                p_static_payloads,
                now()
            );

            SET p_response = JSON_OBJECT('statusCode',200,'message','Email Action inserted successfully');
        END IF;
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `saveEmailSelector`;;
CREATE FUNCTION `saveEmailSelector`(`p_input` json) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_id INT;
    DECLARE p_display_name VARCHAR(255);
    DECLARE p_selector_name VARCHAR(255);
    DECLARE p_selector_query TEXT;
    DECLARE p_status VARCHAR(255);
    DECLARE p_description TEXT;
    DECLARE p_type TEXT;
    DECLARE p_selector_keys TEXT;
    DECLARE p_response JSON;

    -- Extract values from JSON
    SET p_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.id'));
    SET p_display_name = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.display_name'));
    SET p_selector_name = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.selector_name'));
    SET p_selector_query = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.selector_query'));
    SET p_status = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.status'));
    SET p_description = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.description'));
    SET p_type = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.type'));
    SET p_selector_keys = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.selector_keys'));

    -- Check if the Email Selector already exists
    IF EXISTS (SELECT 1 FROM email_selectors WHERE email_selector_id = p_id) THEN

        IF EXISTS (SELECT 1 FROM email_selectors WHERE email_selector_id != p_id AND selector_name = p_selector_name) THEN
            SET p_response = JSON_OBJECT('statusCode',500,'message','Selector Already Exists');
        ELSE
            -- Update existing Email Selector
            UPDATE email_selectors
            SET
                display_name = p_display_name,
                selector_name = p_selector_name,
                selector_query = p_selector_query,
                selector_keys = p_selector_keys,
                description = p_description,
                type = p_type,
                status = p_status,
                modifiedon = now()
            WHERE
                email_selector_id = p_id;

            SET p_response = JSON_OBJECT('statusCode',200,'message','Email Selector updated successfully');
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM email_selectors WHERE selector_name = p_selector_name) THEN
            SET p_response = JSON_OBJECT('statusCode',500,'message','Selector Already Exists');
        ELSE
            -- Insert new Email Selector
            INSERT INTO email_selectors (
            	display_name,
                selector_name,
                selector_query,
                selector_keys,
                status,
                type,
                description,
                createdon
            ) VALUES (
            	p_display_name,
                p_selector_name,
                p_selector_query,
                p_selector_keys,
                p_status,
                p_type,
                p_description,
                now()
            );

            SET p_response = JSON_OBJECT('statusCode',200,'message','Email Selector inserted successfully');
        END IF;
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `saveEmailTemplate`;;
CREATE FUNCTION `saveEmailTemplate`(`p_input` json) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_id INT;
    DECLARE p_template_name VARCHAR(255);
    DECLARE p_subject TEXT;
    DECLARE p_status VARCHAR(255);
    DECLARE p_body TEXT;
    DECLARE p_to_email_ids TEXT;
    DECLARE p_cc_email_ids TEXT;
    DECLARE p_bcc_email_ids TEXT;
    DECLARE p_action_id TEXT;
    DECLARE p_payloads TEXT;
    DECLARE p_editor TEXT;
    DECLARE p_userid INT;
    DECLARE p_response JSON;

    -- Extract values from JSON
    SET p_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.id'));
    SET p_template_name = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.template_name'));
    SET p_subject = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.subject'));
    SET p_status = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.status'));
    SET p_body = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.body'));
    SET p_to_email_ids = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.to_email_ids'));
    SET p_cc_email_ids = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.cc_email_ids'));
    SET p_bcc_email_ids = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.bcc_email_ids'));
    SET p_action_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.action_id'));
    SET p_payloads = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.payloads'));
    SET p_editor = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.editor'));
    SET p_userid = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.userid'));

    -- Check if the Email Template already exists
    IF EXISTS (SELECT 1 FROM email_templates WHERE template_id = p_id) THEN

        IF EXISTS (SELECT 1 FROM email_templates WHERE template_id != p_id AND template_name = p_template_name AND deletedon is null) THEN
            SET p_response = JSON_OBJECT('statusCode',500,'message','Email Template Already Exists');
        ELSE
            -- Update existing Email Template
            UPDATE email_templates
            SET
                template_name = p_template_name,
                subject = p_subject,
                payloads = p_payloads,
                body = p_body,
                to_email_ids = p_to_email_ids,
                cc_email_ids = p_cc_email_ids,
                bcc_email_ids = p_bcc_email_ids,
                action_id = p_action_id,
                editor = p_editor,
                status = p_status,
                modifiedby = p_userid,
                modifiedon = now()
            WHERE
                template_id = p_id;

            SET p_response = JSON_OBJECT('statusCode',200,'message','Email Template Updated Successfully');
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM email_templates WHERE template_name = p_template_name AND deletedon is null) THEN
            SET p_response = JSON_OBJECT('statusCode',500,'message','Email Template Already Exists');
        ELSE
            -- Insert new Email Template
            INSERT INTO email_templates (
                template_name,
                subject,
                payloads,
                status,
                action_id,
                body,
                to_email_ids,
                cc_email_ids,
                bcc_email_ids,
                editor,
                createdby,
                createdon
            ) VALUES (
                p_template_name,
                p_subject,
                p_payloads,
                p_status,
                p_action_id,
                p_body,
                p_to_email_ids,
                p_cc_email_ids,
                p_bcc_email_ids,
                p_editor,
                p_userid,
                now()
            );

            SET p_response = JSON_OBJECT('statusCode',200,'message','Email Template Added Successfully');
        END IF;
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `saveEmailWorkflow`;;
CREATE FUNCTION `saveEmailWorkflow`(`p_input` json) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_id INT;
    DECLARE p_template_id INT;
    DECLARE p_mailuser_id INT;
    DECLARE p_action_id INT;
    DECLARE p_userid INT;
    DECLARE p_status VARCHAR(255);
    DECLARE p_response JSON;

    -- Extract values from JSON
    SET p_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.id'));
    SET p_template_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.template_id'));
    SET p_mailuser_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.mailuser_id'));
    SET p_action_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.action_id'));
    SET p_userid = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.userid'));
    SET p_status = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.status'));

    -- Check if the Email Workflow already exists
    IF EXISTS (SELECT 1 FROM email_workflows WHERE workflow_id = p_id) THEN

        IF EXISTS (SELECT 1 FROM email_workflows WHERE workflow_id != p_id AND action_id = p_action_id AND template_id = p_template_id AND mailuser_id = p_mailuser_id) THEN
            SET p_response = JSON_OBJECT('statusCode',500,'message','Workflow Already Exists');
        ELSE
        	IF EXISTS (SELECT 1 FROM email_workflows WHERE action_id AND status = 'Active') AND p_status='Active' THEN
	            UPDATE email_workflows SET status='Inactive' WHERE action_id = p_action_id;
	        END IF;
            -- Update existing Email Workflow
            UPDATE email_workflows
            SET
                action_id = p_action_id,
                template_id = p_template_id,
                mailuser_id = p_mailuser_id,
                status = p_status,
                modifiedby = p_userid,
                modifiedon = now()
            WHERE
                workflow_id = p_id;

            SET p_response = JSON_OBJECT('statusCode',200,'message','Workflow updated successfully');
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM email_workflows WHERE action_id = p_action_id AND template_id = p_template_id AND mailuser_id = p_mailuser_id) THEN
            SET p_response = JSON_OBJECT('statusCode',500,'message','Workflow Already Exists');
        ELSE

        	IF EXISTS (SELECT 1 FROM email_workflows WHERE action_id AND status = 'Active') AND p_status='Active' THEN
	            UPDATE email_workflows SET status='Inactive' WHERE action_id = p_action_id;
	        END IF;
        	-- Insert new Email Workflow
            INSERT INTO email_workflows (
                action_id,
                template_id,
                mailuser_id,
                status,
                createdby,
                createdon
            ) VALUES (
                p_action_id,
                p_template_id,
                p_mailuser_id,
                p_status,
                p_userid,
                now()
            );

            SET p_response = JSON_OBJECT('statusCode',200,'message','Workflow inserted successfully');
        END IF;
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `saveMenus`;;
CREATE FUNCTION `saveMenus`(`p_input` json, `p_user_id` int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_id INT;
    DECLARE p_parentmenuid INT;
    DECLARE p_menuname VARCHAR(255);
    DECLARE p_displaymenuname VARCHAR(255);
   	DECLARE p_singularmenuname VARCHAR(255);
    DECLARE p_path VARCHAR(255);
    DECLARE p_source VARCHAR(255);
    DECLARE p_icon VARCHAR(255);
    DECLARE p_orderno INT;
    DECLARE p_status VARCHAR(255);
    DECLARE p_type VARCHAR(255);
    DECLARE p_response JSON;

    -- Extract values from JSON
    SET p_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.menuid'));
    SET p_parentmenuid = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.parentmenuid'));
    SET p_menuname = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.menuname'));
    SET p_displaymenuname = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.displaymenuname'));
   	SET p_singularmenuname = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.singularmenuname'));
    SET p_path = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.menupath'));
    SET p_source = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.source'));
    SET p_icon = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.icon'));
    SET p_orderno = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.orderno'));
    SET p_type = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.menutype'));
    SET p_status = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.status'));   
    
    -- Check if the menus already exists
    IF EXISTS (SELECT 1 FROM ad_menus WHERE menuid = p_id) THEN
            -- Update existing menu
            UPDATE ad_menus
            SET
                parentmenuid = p_parentmenuid,
                menuname = p_menuname,
                displaymenuname = p_displaymenuname,
                singularmenuname = p_singularmenuname,
                menupath = p_path,
                source = p_source,
                icon = p_icon,
                orderno = p_orderno,
                menutype = p_type,
                status = CASE
                             WHEN p_status = 'true' THEN 'Active'
                             ELSE 'Inactive'
                         END,
                modifiedby = p_user_id,
                modifiedon = now()
            WHERE
                menuid = p_id;

            SET p_response = JSON_OBJECT('statusCode',200,'message','Menu updated successfully');
        
    ELSE
            -- Insert new menu
            INSERT INTO ad_menus (
                menuname, displaymenuname, singularmenuname, icon, menupath, source, parentmenuid, orderno,menutype, status, createdby, createdon
            ) VALUES (
                p_menuname,p_displaymenuname,p_singularmenuname, p_icon, p_path, p_source, p_parentmenuid, p_orderno,p_type, CASE WHEN p_status = 'true' THEN 'Active' ELSE 'Inactive' END, p_user_id, now()
            );

            SET p_response = JSON_OBJECT('statusCode',200,'message','Menu inserted successfully');
        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `saveOrganizations`;;
CREATE FUNCTION `saveOrganizations`(`p_input` json) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_id INT;
    DECLARE p_orgcode VARCHAR(255);
    DECLARE p_orgname VARCHAR(255);
    DECLARE p_status VARCHAR(255);
    DECLARE p_user_id INT;
    DECLARE p_response JSON;


    -- Extract values from JSON
    SET p_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.orgid'));
    SET p_orgcode = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.orgcode'));
    SET p_orgname = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.orgname'));
    SET p_status = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.status'));
    SET p_user_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.userid'));

    -- Check if the organization already exists
    IF EXISTS (SELECT 1 FROM ad_organizations WHERE orgid = p_id) THEN
        -- Update existing qualification
        UPDATE ad_organizations
        SET
            orgcode = p_orgcode,
            orgname = p_orgname,
            status = CASE
                         WHEN p_status = 'true' THEN 'Active'
                         ELSE 'Inactive'
                     END,
            modifiedby = p_user_id,
            modifiedon = now()
        WHERE
            orgid = p_id;

        SET p_response = JSON_OBJECT('statusCode',200,'message','Organization updated successfully');
    ELSE
        -- Insert new qualification
        INSERT INTO ad_organizations (
            orgcode,
            orgname,
            status,
            createdby,
            createdon
        ) VALUES (
            p_orgcode,
            p_orgname,
            CASE
	             WHEN p_status = 'true' THEN 'Active'
	             ELSE 'Inactive'
	        END,
            p_user_id,
            now()
        );

        SET p_response = JSON_OBJECT('statusCode',200,'message','Organization inserted successfully');
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `saveRoles`;;
CREATE FUNCTION `saveRoles`(`p_input` json, `p_user_id` int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_id INT;
    DECLARE p_rolename VARCHAR(255);
    DECLARE p_displayname VARCHAR(255);
    DECLARE p_description VARCHAR(255);
    DECLARE p_status VARCHAR(255);
    DECLARE p_response JSON;

    -- Extract values from JSON
    SET p_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.roleid'));
    SET p_rolename = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.rolename'));
    SET p_displayname = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.displayname'));
    SET p_description = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.description'));
    SET p_status = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.status'));   
    
    -- Check if the menus already exists
    IF EXISTS (SELECT 1 FROM ad_roles WHERE roleid = p_id) THEN
            -- Update existing menu
            UPDATE ad_roles
            SET
                rolename = p_rolename,
                displayname = p_displayname,
                description = p_description,                    
                status = CASE
                             WHEN p_status = 'true' THEN 'Active'
                             ELSE 'Inactive'
                         END,
                modifiedby = p_user_id,
                modifiedon = now()
            WHERE
                roleid = p_id;

            SET p_response = JSON_OBJECT('statusCode',200,'message','Role updated successfully');
        
    ELSE
            -- Insert new menu
            INSERT INTO ad_roles (
                rolename, displayname, description, status, createdby, createdon
            ) VALUES (
                p_rolename,p_displayname, p_description, CASE WHEN p_status = 'true' THEN 'Active' ELSE 'Inactive' END, p_user_id, now()
            );

            SET p_response = JSON_OBJECT('statusCode',200,'message','Role inserted successfully');
        
    END IF;

    RETURN p_response;
END;;

DROP FUNCTION IF EXISTS `saveUsers`;;
CREATE FUNCTION `saveUsers`(`p_input` json, `p_user_id` int) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_bin
BEGIN
    DECLARE p_id INT;
    DECLARE p_orgid INT;
    DECLARE p_loginid VARCHAR(100);
    DECLARE p_firstname VARCHAR(100);
    DECLARE p_lastname VARCHAR(100);
    DECLARE p_email VARCHAR(100);
    DECLARE p_mobile BIGINT;
    DECLARE p_password VARCHAR(255);
    DECLARE p_status VARCHAR(100);
    DECLARE p_response JSON;
   
   -- Declare variables for exception handling
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_response = JSON_OBJECT('statusCode', 500, 'message', 'An error occurred during the operation');
    END;

    -- Extract values from JSON
    SET p_id = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.id'));
    SET p_orgid = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.orgid'));
    SET p_loginid = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.loginid'));
    SET p_firstname = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.firstname'));
    SET p_lastname = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.lastname'));
    SET p_email = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.email'));
    SET p_mobile = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.mobile'));
    SET p_password = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.password'));
    SET p_status = JSON_UNQUOTE(JSON_EXTRACT(p_input, '$.status'));   
    
    -- Check if the loginid already exists for the given orgid
    IF EXISTS (SELECT 1 FROM ad_users WHERE loginid = p_loginid AND orgid = p_orgid) THEN
        SET p_response = JSON_OBJECT('statusCode', 500, 'message', 'Loginid already exists for the given organization');
    ELSE
	    -- Check if the users already exists
	    IF EXISTS (SELECT 1 FROM ad_menus WHERE menuid = p_id) THEN
	            -- Update existing user
	            UPDATE ad_users
	            SET
	                orgid = p_orgid,
	                loginid = p_loginid,
	                firstname = p_firstname,
	                lastname = p_lastname,
	                email = p_email,
	                mobile = p_mobile,
	                status = CASE
	                             WHEN p_status = 'true' THEN 'Active'
	                             ELSE 'Inactive'
	                         END,
	                modifiedby = p_user_id,
	                modifiedon = now()
	            WHERE
	                userid = p_id;
	
	            SET p_response = JSON_OBJECT('statusCode',200,'message','User updated successfully');
	        
	    ELSE
	            -- Insert new menu
	            INSERT INTO ad_users (
	                orgid, loginid, firstname, lastname, email, mobile, password, status, createdby, createdon
	            ) VALUES (
	                p_orgid,p_loginid, p_firstname, p_lastname, p_email, p_mobile, p_password, CASE WHEN p_status = 'true' THEN 'Active' ELSE 'Inactive' END, p_user_id, now()
	            );
	
	            SET p_response = JSON_OBJECT('statusCode',200,'message','User inserted successfully');
	        
	    END IF;
	 END IF;  

    RETURN p_response;
END;;

DELIMITER ;

DROP TABLE IF EXISTS `ad_menus`;
CREATE TABLE `ad_menus` (
  `menuid` int(11) NOT NULL AUTO_INCREMENT,
  `parentmenuid` int(11) DEFAULT NULL,
  `menuname` varchar(255) NOT NULL,
  `displaymenuname` varchar(100) NOT NULL COMMENT 'Display Menu Name With Plural',
  `singularmenuname` varchar(100) NOT NULL COMMENT 'Singular Menu Name',
  `menutype` enum('Menu','Tab Menu','Nav Menu','Tree Menu') NOT NULL DEFAULT 'Menu',
  `menupath` varchar(255) DEFAULT NULL,
  `submenupath` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `icon` varchar(255) NOT NULL,
  `orderno` bigint(6) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Inactive',
  `createdby` int(11) DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`menuid`)
);

INSERT INTO `ad_menus` (`menuid`, `parentmenuid`, `menuname`, `displaymenuname`, `singularmenuname`, `menutype`, `menupath`, `submenupath`, `source`, `icon`, `orderno`, `status`, `createdby`, `createdon`, `modifiedby`, `modifiedon`, `deletedon`) VALUES
(1,	NULL,	'Dashboard',	'Dashboard',	'Dashboard',	'Menu',	'/components/dashboard',	NULL,	'/dashboard',	'fa fa-tachometer',	1,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-03-25 12:33:52',	NULL),
(2,	NULL,	'Components',	'Components',	'Component',	'Menu',	'/components/components',	'/components/components/view/[...slug]',	'/components',	'fa fa-cubes',	6,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-04-07 08:31:39',	NULL),
(3,	NULL,	'Scenarios',	'Scenarios',	'Scenario',	'Menu',	'/components/scenarios',	'/components/scenarios/view/[...slug],/components/scenarios/quiz/[...slug],/components/scenarios/createscenario,/components/scenarios/flowchart',	'/scenarios',	'fa fa-cube',	4,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-04-07 10:31:53',	NULL),
(11,	NULL,	'Masters',	'Masters',	'Master',	'Tab Menu',	'/components/masters',	NULL,	'/masters',	'ti ti-server',	30,	'Active',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(12,	NULL,	'Notifications',	'Notifications',	'Notification',	'Menu',	'/components/notifications/notificationList',	NULL,	'/notifications',	'ti ti-bell',	99,	'Active',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(13,	NULL,	'Mail Configuration',	'Mail Configuration',	'Mail Configuration',	'Menu',	'/components/mailconfigs',	NULL,	'/mail_configuration',	'ti ti-email',	51,	'Active',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(14,	NULL,	'Notification Configuration',	'Notification Configuration',	'Notification Configuration',	'Menu',	'/components/noticonfigs',	NULL,	'/noti_config',	'ti ti-bell',	52,	'Inactive',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(15,	NULL,	'Access Permission',	'Access Permission',	'Access Permission',	'Tab Menu',	'/components/admin',	NULL,	'/admin',	'ti ti-key',	34,	'Active',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(16,	NULL,	'System Configuration',	'System Configuration',	'System Configuration',	'Menu',	'/components/systemconfigs',	NULL,	'/system_configuration',	'ti ti-settings',	54,	'Inactive',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(17,	NULL,	'Company Setting',	'Company Setting',	'Company Setting',	'Menu',	'/components/companysetting',	NULL,	'/app_config',	'ti ti-settings',	35,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-03-25 04:53:30',	NULL),
(18,	5,	'Manage',	'Manage',	'Manage',	'Menu',	'/components/learners',	NULL,	'/students',	'ti-home',	201,	'Inactive',	1,	'2025-03-31 18:30:00',	1,	NULL,	NULL),
(19,	NULL,	'Batches',	'Batches',	'Batch',	'Menu',	'/components/batches',	'/components/batches/view/[...slug]',	'/batches',	'fa fa-th-large',	99,	'Inactive',	1,	'2025-03-31 18:30:00',	1,	'2025-04-08 04:51:44',	NULL),
(20,	11,	'Component Categories',	'Component Categories',	'Component Category',	'Menu',	'/components/masters/masters/componentcategories',	NULL,	'/component_categories',	'ti ti-home',	510,	'Active',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(21,	11,	'Component Sub Categories',	'Component Sub Categories',	'Component Sub Category',	'Menu',	'/components/masters/masters/componentsubcategory',	NULL,	'/component_sub_categories',	'ti ti-home',	511,	'Inactive',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(22,	11,	'Scenario Categories',	'Scenario Categories',	'Scenario Category',	'Menu',	'/components/masters/masters/scenariocategories',	NULL,	'/scenario_categories',	'ti ti-home',	513,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-04-07 10:32:11',	NULL),
(26,	15,	'Organizations',	'Organizations',	'organization',	'Menu',	'/components/admin/orgnization',	NULL,	'/orgnization',	'ti ti-key',	1001,	'Inactive',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(27,	15,	'Users',	'Users',	'User',	'Menu',	'/components/admin/users',	NULL,	'/users',	'ion-person-stalker',	1002,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-04-08 04:52:58',	NULL),
(28,	15,	'Menus',	'Menus',	'Menu',	'Menu',	'/components/admin/menus',	NULL,	'/menus',	'ti ti-home',	1003,	'Active',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(29,	15,	'Roles',	'Roles',	'Role',	'Menu',	'/components/admin/roles',	NULL,	'/roles',	'ti ti-home',	1004,	'Active',	1,	'2025-03-31 18:30:00',	NULL,	NULL,	NULL),
(30,	15,	'User Role Permission',	'User Role Permissions',	'User Role Permission',	'Tab Menu',	'/components/userrolepermission',	NULL,	'/userrolepermission',	'ti ti-key',	1005,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-07-17 09:42:26',	NULL),
(31,	NULL,	'Users',	'Users',	'User',	'Tab Menu',	'/components/users',	'/components/users/view/[...slug],/components/instructors/view/[...slug]',	'/users-management',	'fa fa-users',	2,	'Active',	1,	'2025-04-02 05:07:29',	1,	'2025-10-15 09:28:21',	NULL),
(32,	31,	'SIMMaster',	'SIMMaster',	'SIMMaster',	'Menu',	'/components/users/adminusers',	NULL,	'/adminusers',	'',	223,	'Active',	1,	'2025-04-02 05:23:19',	1,	'2025-10-15 09:29:19',	NULL),
(33,	31,	'SIMManager',	'SIMManager',	'SIMManager',	'Menu',	'/components/users/instructors',	NULL,	'/instructors',	'',	222,	'Active',	1,	'2025-04-02 05:25:32',	1,	'2025-10-15 09:29:06',	NULL),
(34,	31,	'SIMUser',	'SIMUser',	'SIMUser',	'Menu',	'/components/users/normalusers',	NULL,	'/normalusers',	'',	221,	'Active',	1,	'2025-04-02 05:26:25',	1,	'2025-10-15 09:32:49',	NULL),
(36,	11,	'Scenario Sub Categories',	'Scenario Sub Categories',	'Scenario Sub Category',	'Menu',	'/components/masters/masters/scenariosubcategories',	NULL,	'/scenario_subcategories',	'ti ti-home',	514,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-04-07 10:32:11',	NULL),
(37,	NULL,	'User Sessions',	'User Sessions',	'User Sessions',	'Menu',	'/components/usersessions',	'/components/usersessions/view/[...slug],/components/usersessions/view/vnc/[...slug]',	'/user-sessions',	'fa fa-server',	3,	'Active',	2,	'2025-04-23 04:43:38',	NULL,	NULL,	NULL),
(38,	NULL,	'Networks',	'Networks',	'Network',	'Menu',	'/components/network',	NULL,	'/network',	'fa fa-podcast',	8,	'Active',	NULL,	NULL,	1,	'2025-05-15 07:51:53',	NULL),
(39,	NULL,	'SiberSim Logs',	'SiberSim Logs',	'SiberSim Log',	'Menu',	'/components/proxmoxlogs',	NULL,	'/proxmoxlogs',	'fa fa-cloud-download',	33,	'Active',	NULL,	NULL,	1,	'2025-10-14 09:35:16',	NULL),
(40,	NULL,	'Events',	'Events',	'Event',	'Menu',	'/components/events',	NULL,	'/events',	'ti ti-dropbox',	9,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(41,	NULL,	'FAQs',	'FAQs',	'FAQ',	'Menu',	'/components/faqs',	NULL,	'/faqs',	'ti-help-alt',	36,	'Active',	1,	'2025-06-05 06:22:36',	NULL,	NULL,	NULL),
(43,	11,	'FAQs',	'FAQs',	'FAQ',	'Menu',	'/components/masters/masters/faqs',	NULL,	'/faqs',	'ti ti-home',	515,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-04-07 10:32:11',	NULL),
(44,	NULL,	'Event Dashboard',	'Event Dashboard',	'Event Dashboard',	'Menu',	'/components/eventdashboard',	NULL,	'/event-dashboard',	'ti ti-layout-grid2',	10,	'Active',	1,	'2025-06-20 07:11:38',	NULL,	NULL,	NULL),
(45,	11,	'Widgets',	'Widgets',	'Widget',	'Menu',	'/components/masters/masters/widgets',	NULL,	'/widgets',	'ti ti-home',	516,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(46,	NULL,	'Scenario Termination',	'Scenario Termination',	'Scenario Termination',	'Menu',	'/components/scenariotermination',	NULL,	'/scenariotermination',	'ti ti-dropbox',	13,	'Active',	NULL,	'2025-07-10 06:14:34',	NULL,	NULL,	NULL),
(47,	122,	'Login Logs',	'Login Logs',	'Login Log',	'Tab Menu',	'/components/loginlogs',	NULL,	'/loginlogs',	'ti ti-home',	4,	'Active',	1,	'2025-07-11 05:35:32',	NULL,	NULL,	NULL),
(48,	122,	'User Report',	'User Report',	'User Report',	'Tab Menu',	'/components/userreport',	NULL,	'/userreport',	'ti ti-dropbox',	7,	'Active',	NULL,	'2025-07-11 05:42:42',	NULL,	NULL,	NULL),
(50,	47,	'Admin Log',	'Admin Log',	'Admin Log',	'Menu',	'/components/loginlogs/report/adminuserlogs',	NULL,	'/adminuserlogs',	'',	517,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(51,	47,	'Instructor Log',	'Instructor Log',	'Instructor Log',	'Menu',	'/components/loginlogs/report/instructorlogs',	NULL,	'/instructorlogs',	'',	518,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(52,	47,	'Normal User Log',	'Normal User Log',	'Normal User Log',	'Menu',	'/components/loginlogs/report/normaluserlogs',	NULL,	'/normaluserlogs',	'',	519,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(53,	122,	'Instructor Report',	'Instructor Report',	'Instructor Report',	'Tab Menu',	'/components/instructorreport',	NULL,	'/instructorreport',	'ti ti-dropbox',	7,	'Active',	NULL,	'2025-07-16 06:26:45',	NULL,	NULL,	NULL),
(122,	NULL,	'Reports',	'Reports',	'Report',	'Tree Menu',	'',	NULL,	'',	'ti ti-menu',	1100,	'Active',	1,	NULL,	1,	NULL,	NULL),
(123,	48,	'User Profile Report',	'User Profile Report',	'User Profile Report',	'Menu',	'/components/userreport/report/userprofile',	NULL,	'/userprofile',	'ti ti-home',	1101,	'Active',	1,	NULL,	1,	NULL,	NULL),
(124,	48,	'User Performance Report',	'User Performance Report',	'User Performance Report',	'Menu',	'/components/userreport/report/userperformance',	NULL,	'/userperformance',	'ti ti-key',	1102,	'Active',	1,	NULL,	1,	NULL,	NULL),
(125,	53,	'Instructor Performance Report',	'Instructor Performance Report',	'Instructor Performance Report',	'Menu',	'/components/instructorreport/report/instructorperformance',	NULL,	'/instructorperformance',	'ti ti-home',	1103,	'Active',	1,	NULL,	1,	NULL,	NULL),
(126,	53,	'Instructor Profile Report',	'Instructor Profile Report',	'Instructor Profile Report',	'Menu',	'/components/instructorreport/report/instructorprofile',	NULL,	'/instructorprofile',	'ti ti-key',	1104,	'Active',	1,	NULL,	1,	NULL,	NULL),
(127,	NULL,	'Custom Component',	'Custom Components',	'Custom Component',	'Menu',	'/components/customcomponent',	NULL,	'/customcomponent',	'fa fa-cubes	',	38,	'Active',	1,	'2025-11-14 06:22:41',	1,	NULL,	NULL),
(128,	NULL,	'Custom Scenarios',	'Custom Scenarios',	'Custom Scenario',	'Menu',	'/components/customscenarios',	'/components/customscenarios/view/[...slug]',	'/customscenarios',	'fa fa-cube',	5,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-04-07 10:31:53',	NULL),
(129,	11,	'Customized Panel',	'Customized Panels',	'Customized Panel',	'Menu',	'/components/masters/masters/scenariotabs',	NULL,	'/scenariotabs',	'ti ti-home',	520,	'Active',	NULL,	NULL,	1,	'2025-11-14 04:50:55',	NULL),
(130,	NULL,	'Customers',	'Customers',	'Customers',	'Menu',	'/components/customers',	NULL,	'/customers',	'fa fa-cubes',	5,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(131,	NULL,	'Pause Scenarios',	'Pause Scenarios',	'Pause Scenario',	'Menu',	'/components/pausescenarios',	NULL,	'/pausescenarios',	'fa fa-server',	4,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(133,	NULL,	'Custom Component',	'Custom Component',	'Custom Component',	'Menu',	'/components/customcomponent',	NULL,	'/customcomponent',	'fa fa-cubes',	0,	'Active',	NULL,	'2025-11-26 07:08:06',	NULL,	NULL,	NULL),
(134,	NULL,	'Customer Dashboard',	'Dashboard',	'Dashboard',	'Menu',	'/components/customers/customerDashboard',	NULL,	'/customer-dashboard',	'fa fa-tachometer',	1,	'Active',	1,	'2025-03-31 18:30:00',	1,	'2025-03-25 12:33:52',	NULL),
(135,	NULL,	'Scenario Exports',	'Scenario Exports',	'Scenario Export',	'Menu',	'/components/scenarioexport',	NULL,	'/scenarioexport',	'fa fa-cube',	6,	'Active',	0,	'2025-11-28 11:23:09',	NULL,	'2025-12-01 05:54:36',	NULL),
(136,	NULL,	'Labs',	'Labs',	'Labs',	'Menu',	'/components/labs',	NULL,	'/labs',	'fa fa-tachometer',	135,	'Active',	NULL,	'2025-12-04 05:12:20',	NULL,	NULL,	NULL);

DROP TABLE IF EXISTS `ad_organizations`;
CREATE TABLE `ad_organizations` (
  `orgid` int(11) NOT NULL AUTO_INCREMENT,
  `orgcode` varchar(100) NOT NULL,
  `orgname` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Inactive',
  `createdby` int(11) DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`orgid`)
);

INSERT INTO `ad_organizations` (`orgid`, `orgcode`, `orgname`, `status`, `createdby`, `createdon`, `modifiedby`, `modifiedon`, `deletedon`) VALUES
(1,	'siberSIM',	'siberSIM',	'Active',	NULL,	NULL,	NULL,	NULL,	NULL);

DROP TABLE IF EXISTS `ad_rolemenumap`;
CREATE TABLE `ad_rolemenumap` (
  `rolemenumapid` int(11) NOT NULL AUTO_INCREMENT,
  `menuid` int(11) NOT NULL,
  `roleid` int(11) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `createdby` int(11) DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`rolemenumapid`)
);

INSERT INTO `ad_rolemenumap` (`rolemenumapid`, `menuid`, `roleid`, `status`, `createdby`, `createdon`, `modifiedby`, `modifiedon`) VALUES
(1,	15,	3,	'Active',	1,	'2025-12-17 12:29:03',	NULL,	NULL),
(2,	27,	3,	'Active',	1,	'2025-12-17 12:29:03',	NULL,	NULL),
(3,	28,	3,	'Active',	1,	'2025-12-17 12:29:04',	NULL,	NULL),
(4,	29,	3,	'Active',	1,	'2025-12-17 12:29:04',	NULL,	NULL),
(5,	30,	3,	'Active',	1,	'2025-12-17 12:29:04',	NULL,	NULL),
(6,	17,	3,	'Active',	1,	'2025-12-17 12:29:04',	NULL,	NULL),
(7,	13,	3,	'Active',	1,	'2025-12-17 12:29:04',	NULL,	NULL),
(8,	1,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(9,	31,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(10,	34,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(11,	33,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(12,	32,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(13,	37,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(14,	3,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(15,	131,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(16,	128,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(17,	2,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(18,	38,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(19,	40,	1,	'Active',	1,	'2025-12-17 12:30:55',	NULL,	NULL),
(20,	44,	1,	'Active',	1,	'2025-12-17 12:30:56',	NULL,	NULL),
(21,	46,	1,	'Active',	1,	'2025-12-17 12:30:56',	NULL,	NULL),
(22,	11,	1,	'Active',	1,	'2025-12-17 12:30:56',	NULL,	NULL),
(23,	20,	1,	'Active',	1,	'2025-12-17 12:30:56',	NULL,	NULL),
(24,	22,	1,	'Active',	1,	'2025-12-17 12:30:56',	NULL,	NULL),
(25,	36,	1,	'Active',	1,	'2025-12-17 12:30:56',	NULL,	NULL),
(26,	43,	1,	'Active',	1,	'2025-12-17 12:30:56',	NULL,	NULL),
(27,	45,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(28,	129,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(29,	39,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(30,	17,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(31,	41,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(32,	12,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(33,	122,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(34,	47,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(35,	50,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(36,	51,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(37,	52,	1,	'Active',	1,	'2025-12-17 12:30:57',	NULL,	NULL),
(38,	53,	1,	'Active',	1,	'2025-12-17 12:30:58',	NULL,	NULL),
(39,	125,	1,	'Active',	1,	'2025-12-17 12:30:58',	NULL,	NULL),
(40,	126,	1,	'Active',	1,	'2025-12-17 12:30:58',	NULL,	NULL),
(41,	48,	1,	'Active',	1,	'2025-12-17 12:30:58',	NULL,	NULL),
(42,	123,	1,	'Active',	1,	'2025-12-17 12:30:58',	NULL,	NULL),
(43,	124,	1,	'Active',	1,	'2025-12-17 12:30:58',	NULL,	NULL),
(44,	1,	2,	'Active',	1,	'2025-12-17 12:32:18',	NULL,	NULL),
(45,	31,	2,	'Active',	1,	'2025-12-17 12:32:18',	NULL,	NULL),
(46,	34,	2,	'Active',	1,	'2025-12-17 12:32:18',	NULL,	NULL),
(47,	37,	2,	'Active',	1,	'2025-12-17 12:32:18',	NULL,	NULL),
(48,	3,	2,	'Active',	1,	'2025-12-17 12:32:19',	NULL,	NULL),
(49,	134,	4,	'Active',	1,	'2025-12-17 12:32:39',	NULL,	NULL),
(50,	130,	4,	'Active',	1,	'2025-12-17 12:32:39',	NULL,	NULL);

DROP TABLE IF EXISTS `ad_roles`;
CREATE TABLE `ad_roles` (
  `roleid` int(11) NOT NULL AUTO_INCREMENT,
  `rolename` varchar(255) NOT NULL,
  `displayname` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Inactive',
  `default_role` enum('Yes','No') NOT NULL DEFAULT 'No',
  `createdby` int(11) NOT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`roleid`)
);

INSERT INTO `ad_roles` (`roleid`, `rolename`, `displayname`, `description`, `status`, `default_role`, `createdby`, `createdon`, `modifiedby`, `deletedon`, `modifiedon`) VALUES
(1,	'Admin',	'Admin',	'Admin',	'Active',	'Yes',	1,	'2025-03-25 04:08:28',	2,	NULL,	'2025-08-01 07:17:13'),
(2,	'Instructor',	'Instructor',	'Instructor',	'Active',	'Yes',	1,	'2025-03-25 04:08:39',	2,	NULL,	'2025-08-01 07:17:50'),
(3,	'Super Admin',	'Super Admin',	'Super Admin',	'Active',	'No',	1,	'2025-03-25 04:08:28',	2,	NULL,	'2025-08-05 13:25:36'),
(4,	'License Ops',	'License Ops',	'License Ops',	'Active',	'No',	1,	'2025-08-05 12:44:22',	2,	NULL,	'2025-08-05 13:25:39');

DROP TABLE IF EXISTS `ad_userrolemap`;
CREATE TABLE `ad_userrolemap` (
  `userrolemapid` int(11) NOT NULL AUTO_INCREMENT,
  `orgid` int(11) NOT NULL DEFAULT 1,
  `userid` int(11) NOT NULL,
  `roleid` int(11) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `createdby` int(11) DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`userrolemapid`),
  KEY `user_id` (`userid`),
  KEY `qualification_id` (`roleid`)
);

INSERT INTO `ad_userrolemap` (`userrolemapid`, `orgid`, `userid`, `roleid`, `status`, `createdby`, `createdon`, `modifiedby`, `modifiedon`) VALUES
(1,	1,	1,	3,	'Active',	0,	'2025-12-17 12:29:25',	NULL,	NULL),
(2,	1,	2,	1,	'Active',	0,	'2025-12-17 12:31:37',	NULL,	NULL);

DROP TABLE IF EXISTS `ad_users`;
CREATE TABLE `ad_users` (
  `userid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'User Primary ID',
  `useruuid` char(36) NOT NULL DEFAULT uuid() COMMENT 'User Unique Id',
  `orgid` int(11) NOT NULL DEFAULT 1 COMMENT 'Foreign Key Org_ID',
  `loginid` varchar(100) NOT NULL,
  `firstname` varchar(100) NOT NULL COMMENT 'User First Name',
  `lastname` varchar(100) DEFAULT NULL COMMENT 'User last Name',
  `email` varchar(100) NOT NULL COMMENT 'User Email',
  `mobile` varchar(100) DEFAULT NULL COMMENT 'User Mobile Number',
  `password` varchar(255) NOT NULL COMMENT 'User Panel Password',
  `usertype` enum('Admin','Instructor') DEFAULT 'Admin' COMMENT 'User Type',
  `theme_preference` enum('dark','light') DEFAULT 'dark' COMMENT 'Theme preference',
  `organization` varchar(255) DEFAULT NULL COMMENT 'Instructor Organization',
  `address` text DEFAULT NULL COMMENT 'Instructor Address',
  `profile` text DEFAULT NULL COMMENT 'Profile Image',
  `otp` int(11) DEFAULT NULL,
  `otptimeout` timestamp NULL DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Current Status',
  `isverified` enum('Yes','No') NOT NULL DEFAULT 'No',
  `createdby` int(11) DEFAULT NULL COMMENT 'CreatedBy ID',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created Date',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'ModifiedBy ID',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified Date',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted Date',
  PRIMARY KEY (`userid`),
  KEY `org_id` (`orgid`)
);

INSERT INTO `ad_users` (`userid`, `useruuid`, `orgid`, `loginid`, `firstname`, `lastname`, `email`, `mobile`, `password`, `usertype`, `theme_preference`, `organization`, `address`, `profile`, `otp`, `otptimeout`, `status`, `isverified`, `createdby`, `createdon`, `modifiedby`, `modifiedon`, `deletedon`) VALUES
(1,	'5d5e3655-1449-11f0-8dd0-000c29cf0cb1',	1,	'superadmin',	'Super',	'Admin',	'suraj_surkar@technobase.in',	'8787878787',	'$2b$10$4zy7MNCmIdqrGVkFjyy/4.FzNnRuGCBGO/e5GXug0TnTpWkxF5fUy',	'Admin',	'dark',	NULL,	NULL,	'/uploads/Profile/1744981575576_dummy.jpg',	NULL,	NULL,	'Active',	'Yes',	NULL,	NULL,	2,	'2025-04-15 09:04:58',	NULL),
(2,	'5d5e39cb-1449-11f0-8dd0-000c29cf0cb1',	1,	'admin',	'Master',	'Admin',	'hazri@ofisgate.com',	'133689971',	'$2b$10$b/H5V/RCEkMvZ7wWiD4F4eU9pOo4tYJ7LS0L28DXlT8O2kLtiO3dW',	'Admin',	'dark',	NULL,	NULL,	'/uploads/Profile/1754996763662_WhatsAppImage2025-07-16at10.45.23.jpeg',	NULL,	NULL,	'Active',	'Yes',	NULL,	NULL,	2,	'2025-11-26 13:11:30',	NULL);

DROP TABLE IF EXISTS `ad_user_refresh_tokens`;
CREATE TABLE `ad_user_refresh_tokens` (
  `refreshtokenid` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `access_token` text NOT NULL,
  `refresh_token` text NOT NULL,
  `token_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`token_json`)),
  `logged_in` timestamp NULL DEFAULT NULL,
  `logged_out` timestamp NULL DEFAULT NULL,
  `is_valid` tinyint(1) DEFAULT 1,
  `createdon` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`refreshtokenid`)
);


DROP TABLE IF EXISTS `batches`;
CREATE TABLE `batches` (
  `batchid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `batchuuid` char(36) NOT NULL DEFAULT uuid() COMMENT 'Batch Unique Id',
  `batchname` varchar(255) NOT NULL COMMENT 'Batch Name',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  `createdby` int(11) DEFAULT NULL COMMENT 'Create By Id',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Created On',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`batchid`)
);


DROP TABLE IF EXISTS `batch_learner_map`;
CREATE TABLE `batch_learner_map` (
  `batchlearnerid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `batchid` int(11) NOT NULL COMMENT 'Batch Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `createdby` int(11) DEFAULT NULL COMMENT 'Create By Id',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`batchlearnerid`),
  KEY `batchid` (`batchid`)
);


DROP TABLE IF EXISTS `components`;
CREATE TABLE `components` (
  `componentid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `componentuuid` char(36) NOT NULL DEFAULT uuid() COMMENT 'Component Unique Id',
  `componentcategoryid` int(11) NOT NULL COMMENT 'Component Category Id',
  `componenttype` enum('LXC','QEMU') NOT NULL DEFAULT 'LXC' COMMENT 'Component Type',
  `vmid` bigint(20) NOT NULL COMMENT 'Component Identification',
  `componentname` varchar(250) NOT NULL COMMENT 'Component Name',
  `vmid_name` varchar(250) NOT NULL COMMENT 'Proxmox vmid-name',
  `component_status` enum('Public','Private') NOT NULL DEFAULT 'Public' COMMENT 'Component status',
  `componentimage` text DEFAULT NULL COMMENT 'Component Image',
  `duration` bigint(20) DEFAULT 0 COMMENT 'Configuration Delay',
  `proxmox_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Proxmox API Json' CHECK (json_valid(`proxmox_json`)),
  `network_bridge_name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Network Bridge Name',
  `network_ports` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Network Port',
  `cores` int(11) DEFAULT NULL COMMENT 'Virtual CPU',
  `memory` int(11) DEFAULT NULL COMMENT 'Virtual Memory',
  `storage` varchar(255) DEFAULT NULL COMMENT 'Storage Size',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  `createdby` int(11) DEFAULT NULL COMMENT 'Create By Id',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`componentid`)
);


DROP TABLE IF EXISTS `component_categories`;
CREATE TABLE `component_categories` (
  `componentcategoryid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `componentcategoryuuid` char(36) NOT NULL DEFAULT uuid() COMMENT 'Component Category Unique Id',
  `categoryname` varchar(255) NOT NULL COMMENT 'Component Category Name',
  `categoryimage` text DEFAULT NULL COMMENT 'Component Category Image',
  `description` longtext DEFAULT NULL COMMENT 'Description',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  `createdby` int(11) DEFAULT NULL COMMENT 'Created By Id',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`componentcategoryid`)
);


DROP TABLE IF EXISTS `component_export`;
CREATE TABLE `component_export` (
  `componentexportid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'component export Id',
  `componentid` int(11) NOT NULL COMMENT 'component Id',
  `exportid` int(11) DEFAULT NULL COMMENT 'export id',
  `vmid` int(11) NOT NULL COMMENT 'vmid',
  `scenarioid` int(11) DEFAULT NULL COMMENT 'Scenario ID',
  `upid` varchar(255) DEFAULT NULL COMMENT 'Upid',
  `file_name` varchar(255) DEFAULT NULL COMMENT 'File name',
  `status` enum('Pending','Failed','Running','Completed') NOT NULL DEFAULT 'Pending' COMMENT 'status',
  `reject_reason` varchar(255) DEFAULT NULL COMMENT 'Reject Reason',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'createdon',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'modifiedon',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'deletedon',
  PRIMARY KEY (`componentexportid`)
);


DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `customerid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Customer Primary Id',
  `customeruuid` char(36) NOT NULL COMMENT 'Customer Unique Id',
  `firstname` varchar(100) NOT NULL COMMENT 'Customer First Name',
  `lastname` varchar(100) DEFAULT NULL COMMENT 'Customer Last Name',
  `email` varchar(100) NOT NULL COMMENT 'Customer Email',
  `mobile` varchar(100) DEFAULT NULL COMMENT 'Customer Mobile Number',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Current Status',
  `createdby` int(11) DEFAULT NULL COMMENT 'CreatedBy ID',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created Date',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'ModifiedBy ID',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified Date',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted Date',
  PRIMARY KEY (`customerid`)
);


DROP TABLE IF EXISTS `customer_license`;
CREATE TABLE `customer_license` (
  `customer_license_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Customer License Id',
  `customer_license_uuid` char(36) NOT NULL COMMENT 'Customer License Unique ID',
  `customer_id` int(11) NOT NULL COMMENT 'Customer ID',
  `sim_user_count` int(11) NOT NULL COMMENT 'SIM User Count',
  `start_date` timestamp NULL DEFAULT NULL COMMENT 'Start Date',
  `expiry_date` timestamp NULL DEFAULT NULL COMMENT 'Expiry Date',
  `license_key` varchar(255) NOT NULL COMMENT 'License Key',
  `domain_url` varchar(255) NOT NULL COMMENT 'Domain URl',
  `created_by` int(11) DEFAULT NULL COMMENT 'Created by ID',
  `created_on` timestamp NULL DEFAULT NULL COMMENT 'Created date',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified by ',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  PRIMARY KEY (`customer_license_id`)
);


DROP TABLE IF EXISTS `custom_component`;
CREATE TABLE `custom_component` (
  `customcomponentid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'custom id',
  `customcomponentuuid` char(36) NOT NULL COMMENT 'uuid',
  `componentname` varchar(250) NOT NULL COMMENT 'Component name',
  `scenarioid` int(11) NOT NULL COMMENT 'Scenario Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `componentcategoryid` int(11) NOT NULL COMMENT 'component category',
  `master_vmid` int(11) NOT NULL COMMENT 'Master Vmid',
  `clone_vmid` int(11) NOT NULL COMMENT 'clone Vmid',
  `vmid` int(11) DEFAULT NULL COMMENT 'vmid',
  `componenttype` enum('LXC','QEMU') DEFAULT 'LXC' COMMENT 'component type',
  `duration` bigint(20) DEFAULT 0 COMMENT 'duration',
  `componentimage` text DEFAULT NULL COMMENT 'component Image',
  `status` enum('pending','approved','reject') NOT NULL DEFAULT 'pending' COMMENT 'status',
  `componentStatus` enum('Pending','Stop','Start') NOT NULL DEFAULT 'Pending' COMMENT 'Component Status',
  `createdby` int(11) DEFAULT NULL COMMENT 'createdby',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'createdon',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'modifiedby',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'modifiedon',
  PRIMARY KEY (`customcomponentid`)
);


DROP TABLE IF EXISTS `custom_scenarios`;
CREATE TABLE `custom_scenarios` (
  `custom_scenarioid` int(11) NOT NULL AUTO_INCREMENT,
  `custom_scenariouuid` char(36) NOT NULL DEFAULT 'uuid()',
  `scenariotitle` tinytext NOT NULL,
  `scenarioidentification` varchar(100) NOT NULL,
  `scenariodescription` text DEFAULT NULL,
  `scenariolevel` enum('Easy','Hard','Medium') NOT NULL DEFAULT 'Easy',
  `scenariocategoryid` int(11) NOT NULL,
  `scenariosubcategoryid` int(11) NOT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `learner_id` int(11) DEFAULT NULL,
  `approval_status` enum('Pending','Approve','Reject','Draft') NOT NULL DEFAULT 'Pending',
  `scenarioimage` text DEFAULT NULL,
  `scenariodiagram` longtext DEFAULT NULL,
  `components` longtext DEFAULT NULL,
  `component_config` longtext DEFAULT NULL,
  `network_config` longtext DEFAULT NULL,
  `instruction_file` varchar(255) DEFAULT NULL,
  `duration` bigint(20) DEFAULT NULL,
  `scenariostatus` enum('Draft','Publish') NOT NULL DEFAULT 'Draft',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `reject_reason` text NOT NULL,
  `publishedon` datetime DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`custom_scenarioid`)
);


DROP TABLE IF EXISTS `email_actions`;
CREATE TABLE `email_actions` (
  `action_id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `displayname` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Inactive',
  `payloads` text DEFAULT NULL,
  `static_payloads` text DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`action_id`)
);

INSERT INTO `email_actions` (`action_id`, `type`, `action`, `displayname`, `status`, `payloads`, `static_payloads`, `createdon`, `modifiedon`) VALUES
(1,	'User',	'otp_email',	'OTP Verification Email',	'Active',	'userid',	'[\"otp\",\"otp_timeout\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(2,	'User',	'welcome_email',	'Welcome Email',	'Active',	'userid',	'',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(3,	'User',	'new_password_updated',	'New Password Updated',	'Active',	'userid',	'',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(4,	'User',	'otp_email_forgot',	'OTP Verification Email for Forgot',	'Active',	'userid',	'[\"otp\",\"otp_timeout\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(5,	'Learner',	'learner_otp_email',	'Learner Login OTP',	'Active',	'learner_id',	'[\"otp\",\"otp_timeout\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(6,	'Learner',	'learner_otp_email_forgot',	'Learner Forgot Password OTP',	'Active',	'learner_id',	'[\"otp\",\"otp_timeout\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(7,	'Learner',	'learner_new_password_updated',	'Learner New Password Updated',	'Active',	'learner_id',	'',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(8,	'Learner',	'learner_welcome_email',	'Learner Welcome Mail',	'Active',	'learner_id',	'',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(10,	'Learner',	'learner_account_confirmation_success',	'Learner Account Verification By Admin',	'Active',	'learner_id',	'',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(11,	'Instructor',	'instructor_reset_password',	'Instructor Reset Password',	'Active',	'instructor_id',	'[\"password\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(12,	'Instructor',	'instructor_account_verification',	'Instructor Account Verification By Admin',	'Active',	'instructor_id',	'',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(13,	'Instructor',	'instructor_welcome_mail',	'Instructor Welcome Mail',	'Active',	'instructor_id',	'[\"password\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(16,	'Learner',	'learner_reset_password',	'Learner Reset Password',	'Active',	'learner_id',	'[\"password\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(17,	'User',	'admin_reset_password',	'Admin User Reset Password',	'Active',	'userid',	'[\"password\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(18,	'System',	'proxmox_down_alert',	'Proxmox Down Alert Mail',	'Active',	'',	'[\"downdatetime\"]',	'2023-12-05 04:42:03',	'2023-12-05 07:37:29'),
(19,	'Customer',	'customer_license_mail',	'License Key for Account Activation / Upgrade',	'Active',	'customerid',	'[\"start_date\",\"expiry_date\",\"license_key\",\"sim_user_count\"]',	NULL,	NULL);

DROP TABLE IF EXISTS `email_logs`;
CREATE TABLE `email_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `action_id` int(11) NOT NULL,
  `sender_email_id` text DEFAULT NULL,
  `to_email_ids` text DEFAULT NULL,
  `cc_email_ids` text DEFAULT NULL,
  `bcc_email_ids` text DEFAULT NULL,
  `subject` text DEFAULT NULL,
  `body` text DEFAULT NULL,
  `attachments` text DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `senton` timestamp NULL DEFAULT NULL,
  `response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `error` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_active` enum('Yes','No') NOT NULL DEFAULT 'No',
  PRIMARY KEY (`log_id`)
);


DROP TABLE IF EXISTS `email_queues`;
CREATE TABLE `email_queues` (
  `queue_id` int(11) NOT NULL AUTO_INCREMENT,
  `action_id` int(11) DEFAULT NULL,
  `action_name` varchar(255) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `is_processing` enum('Yes','No') NOT NULL DEFAULT 'No',
  `send_date` timestamp NULL DEFAULT NULL,
  `processon` timestamp NULL DEFAULT NULL,
  `erroron` timestamp NULL DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `attachments` text DEFAULT NULL,
  PRIMARY KEY (`queue_id`)
);


DROP TABLE IF EXISTS `email_selectors`;
CREATE TABLE `email_selectors` (
  `selector_id` int(11) NOT NULL AUTO_INCREMENT,
  `display_name` varchar(255) NOT NULL,
  `selector_name` text NOT NULL,
  `selector_query` text NOT NULL,
  `selector_keys` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `return_single_value` enum('Yes','No') NOT NULL DEFAULT 'Yes',
  `key_type` enum('Email','Number','Others') NOT NULL DEFAULT 'Others',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `deletedon` timestamp NULL DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`selector_id`)
);

INSERT INTO `email_selectors` (`selector_id`, `display_name`, `selector_name`, `selector_query`, `selector_keys`, `description`, `return_single_value`, `key_type`, `status`, `deletedon`, `createdon`, `modifiedon`) VALUES
(1,	'Admin Email',	'admin_email',	'select \'suraj_surkar@technobase.in\' as value',	NULL,	'Admin Email',	'Yes',	'Email',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(2,	'Regards Name',	'regards_name',	'select \'siberSIM Team\' as value',	NULL,	'Regards From Name',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(3,	'Admin Panel Link',	'user_login_link',	'select \'http://localhost:4001/admin-login\' as value',	NULL,	'Portal URL',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(4,	'User Name',	'user_name',	'select concat(m.firstname,\' \',m.lastname) as value from ad_users m where m.userid = ?',	'userid',	'User Name',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(5,	'User Email ID',	'user_email_id',	'select m.email as value from ad_users m where m.userid = ?',	'userid',	'User Email Id',	'Yes',	'Email',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(6,	'Student Panel link',	'learner_login_link',	'select \'http://localhost:4000\' as value',	NULL,	'Learner Login Link',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(7,	'Student Name',	'learner_name',	'select concat(m.firstname,\' \',m.lastname) as value from learners m where m.learner_id = ?',	'learner_id',	'Learner Name',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(8,	'Student Email ID',	'learner_email_id',	'select m.email as value from learners m where m.learner_id = ?',	'learner_id',	'Learner Email ID',	'Yes',	'Email',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(9,	'Student Mobile',	'learner_mobile',	'select m.mobile as value from learners m where m.learner_id = ?',	'learner_id',	'Learner Mobile',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(10,	'Student Account Password',	'learner_password',	'select m.password as value from learners m where m.learner_id = ?',	'learner_id',	'Learner Account Password',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(11,	'Instructor Name',	'instructor_name',	'select concat(m.firstname,\' \',m.lastname) as value from ad_users m where m.userid = ?',	'instructor_id',	'Instructor Name',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(12,	'Instructor Email ID',	'instructor_email_id',	'select m.email as value from ad_users m where m.userid = ?',	'instructor_id',	'Instructor Email Id',	'Yes',	'Email',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(13,	'Instructor Username',	'instructor_username',	'select m.loginid as value from ad_users m where m.userid = ?',	'instructor_id',	'Instructor Username',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(14,	'Instructor Verification Link',	'instructor_verification_link',	'select concat(\'http://localhost:4001/instructor-verification/\',useruuid) as value from ad_users m where m.userid = ?',	'instructor_id',	'Instructor Verification Link',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(16,	'Student Username',	'learner_username',	'select m.username as value from learners m where m.learner_id = ?',	'learner_id',	'Learner Username',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(17,	'learner Verification Link',	'learner_verification_link',	'select concat(\'http://localhost:4000/users-verification/\',learner_uuid) as value from learners m where m.learner_id= ?',	'learner_id',	'learner Verification Link',	'Yes',	'Others',	'Active',	NULL,	'2025-04-16 20:44:10',	'2025-04-16 20:44:10'),
(18,	'User Username',	'user_username',	'select m.loginid as value from ad_users m where m.userid = ?',	'userid',	'User Username',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(19,	'Instructor Panel Link',	'instructor_login_link',	'select \'http://localhost:4001\' as value',	NULL,	'Instructor Panel Link',	'Yes',	'Others',	'Active',	NULL,	'2023-12-06 04:24:28',	'2023-12-06 04:24:28'),
(20,	'Scenario Title',	'scenariotitle ',	'select scenariotitle as value from scenarios where scenarioid = ?',	'scenarioid',	'Scenario Title',	'Yes',	'Others',	'Active',	NULL,	'2025-06-27 08:39:10',	NULL),
(21,	'Proxmox Email Sent To',	'proxmox_email_sent',	'select proxmox_email_sent as value from web_settings limit 1',	'',	'Proxmox Email Sent To',	'Yes',	'Others',	'Active',	NULL,	'2025-06-27 08:39:10',	NULL),
(22,	'Customer Name',	'customer_name',	'select concat(m.firstname,\' \',m.lastname) as value from customers m where m.customerid = ?',	'customerid',	'Customer Name',	'Yes',	'Others',	'Active',	NULL,	'2025-11-20 09:17:46',	'2025-11-20 09:17:46'),
(23,	'Customer Email',	'customer_email',	'select m.email as value from customers m where m.customerid = ?',	'customerid',	'Customer Email',	'Yes',	'Email',	'Active',	NULL,	'2025-11-20 09:17:46',	'2025-11-20 09:17:46');

DROP TABLE IF EXISTS `email_templates`;
CREATE TABLE `email_templates` (
  `template_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `to_email_ids` text NOT NULL,
  `cc_email_ids` text DEFAULT NULL,
  `bcc_email_ids` text DEFAULT NULL,
  `action_id` int(11) NOT NULL,
  `payloads` text NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Inactive',
  `editor` varchar(50) DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`template_id`)
);

INSERT INTO `email_templates` (`template_id`, `template_name`, `subject`, `body`, `to_email_ids`, `cc_email_ids`, `bcc_email_ids`, `action_id`, `payloads`, `status`, `editor`, `createdby`, `modifiedby`, `deletedon`, `createdon`, `modifiedon`) VALUES
(1,	'User & Instructor - One-Time Password (OTP) For Login',	'One-Time Password (OTP) For Login',	'<p>Dear <strong>$$user_name$$,&nbsp;</strong></p><p>Here is your <strong>One-Time Password (OTP)</strong> to log into your account: <strong>##$.otp##</strong></p><p>Please note that this OTP is valid for <strong>##$.otp_timeout##</strong> minutes.</p><p>If you did not request this OTP, please ignore this email. Your account remains secure.</p><p>Thank you for being a part of <strong>siberSIM!</strong></p><p><strong>Important:</strong> This is an automated email. Please do not reply.</p>',	'$$user_email_id$$',	'$$user_email_id$$',	'',	1,	'',	'Active',	'CK',	NULL,	2,	NULL,	'2023-12-11 23:40:40',	'2025-04-29 09:04:34'),
(2,	'User - Welcome to siberSIM',	'Welcome to siberSIM- Your Learning Journey Begins!',	'<p>Dear $$user_name$$,</p><p>Congratulations! You\'ve officially joined the dynamic team of learners at<strong> siberSIM</strong>. We\'re thrilled to have you on board and look forward to the positive impact we know you\'ll make.&nbsp;</p><p><a href=\"$$user_login_link$$\">Click here to login</a></p><p>We\'re confident that your contributions will enrich our learning community, and we\'re excited to witness your growth and success.</p><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$user_email_id$$',	'$$user_email_id$$',	'$$user_email_id$$',	2,	'',	'Active',	'CK',	NULL,	2,	NULL,	'2023-12-13 23:15:24',	'2025-04-29 09:19:42'),
(3,	'User & Instructor - Password Reset Successfully',	'Password Reset Successfully',	'<p>Dear $$user_name$$</p><p>New password has been updated successfully</p><p>Thanks &amp; Regards<br>$$regards_name$$</p><p><br><strong>Important:</strong> This is an automated email. Please do not reply.</p>',	'$$user_email_id$$',	'',	'',	3,	'',	'Active',	'CK',	NULL,	2,	NULL,	'2023-12-14 02:09:51',	'2025-04-29 09:03:13'),
(4,	'User & Instructor Forgot Password OTP',	'OTP For Reset Account Password',	'<p>Dear $$user_name$$,</p><p>Your &nbsp;<strong>One-Time Password (OTP) </strong>for reset password is: <strong>##$.otp##</strong></p><p>Please note that this OTP is valid for <strong>##$.otp_timeout##</strong> minutes.</p><p>If you did not request this OTP, please ignore this email. Your account remains secure.</p><p>Thank you for being a part of <strong>siberSIM!</strong></p><p><strong>Important:</strong> This is an automated email. Please do not reply.</p>',	'$$user_email_id$$',	'',	'',	4,	'',	'Active',	'CK',	1,	2,	NULL,	'2024-01-05 01:14:50',	'2025-04-29 09:07:01'),
(5,	'One-Time Password (OTP) For Login',	'One-Time Password (OTP) For Login',	'<p><strong>Dear $$learner_name$$,&nbsp;</strong></p><p>Here is your <strong>One-Time Password (OTP)</strong> to log into your account: <strong>##$.otp##</strong></p><p>Please note that this OTP is valid for <strong>##$.otp_timeout##</strong> minutes.</p><p>If you did not request this OTP, please ignore this email. Your account remains secure.</p><p>Thank you for being a part of <strong>siberSIM!</strong></p><p><strong>Important:</strong> This is an automated email. Please do not reply.</p>',	'$$learner_email_id$$',	'',	'',	5,	'',	'Active',	'CK',	1,	2,	NULL,	'2024-01-18 05:23:12',	'2025-04-29 09:03:44'),
(6,	'Learner Forgot Password OTP',	'OTP For Reset Account Password',	'<p><strong>Dear $$learner_name$$,</strong></p><p>You requested a password reset for your account. Please use the <strong>One-Time Password (OTP)</strong> below to proceed with resetting your password: <strong>##$.otp##</strong></p><p>This OTP will remain valid for <strong>##$.otp_timeout##</strong> minutes.</p><p>If you did not request a password reset, simply disregard this email. Your account remains secure.</p><p>Thank you for being a part of <strong>siberSIM!</strong></p><p><strong>Note:</strong> This is an automated email. Please do not reply.</p>',	'$$learner_email_id$$',	'',	'',	6,	'',	'Active',	'CK',	1,	2,	NULL,	'2024-01-18 23:23:48',	'2025-04-29 08:54:28'),
(7,	'Learner New Password',	'Password Reset Successfully',	'<p><strong>Dear $$learner_name$$</strong></p><p>New password has been updated successfully</p><p>Thanks &amp; Regards<br><strong>$$regards_name$$</strong></p><p><strong>Important:</strong> This is an automated email. Please do not reply.</p>',	'$$learner_email_id$$',	'$$admin_email$$',	'$$admin_email$$',	7,	'',	'Active',	'CK',	1,	2,	NULL,	'2024-01-18 05:59:50',	'2025-04-29 08:59:27'),
(8,	'Learner Sign Up - Welcome Mail',	'Welcome to siberSIM- Your Learning Journey Begins!',	'<p>Dear $$learner_name$$,</p><p>Congratulations! You\'ve officially joined the dynamic team of learners at<strong> siberSIM</strong>. We\'re thrilled to have you on board and look forward to the positive impact we know you\'ll make.&nbsp;</p><p>Your login credentials for accessing your account are as follows:</p><ul><li><strong>Username</strong>: $$learner_username$$</li><li><strong>Password</strong>: ##password##</li></ul><p>Please click the link below to activate your account:</p><p><a href=\"$$learner_verification_link$$\"><strong>Click here to verify your account</strong></a></p><p>We\'re confident that your contributions will enrich our learning community, and we\'re excited to witness your growth and success.</p><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$learner_email_id$$',	'',	'',	8,	'',	'Active',	'CK',	1,	2,	NULL,	'2024-01-19 04:18:45',	'2025-04-29 09:02:16'),
(9,	'Student Account Verification',	'Account Verification',	'<p>Dear $$learner_name$$,</p><p>Welcome aboard! To activate your account, please confirm your email by clicking the link below:</p><p>$$activalition_link$$</p><p>Once your email is confirmed, your account will be activated.</p><p>Your login credentials for accessing your account are as follows:</p><ul><li>Username: $$learner_username$$</li><li>Password: $$learner_password$$</li><li>URL: $$learner_login_link$$</li></ul><p>Feel free to explore our resources and connect with your fellow learners. If you have any questions or ideas, our doors (and inboxes) are always open!</p><p>We\'re confident that your contributions will enrich our learning community, and we\'re excited to witness your growth and success.</p><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$learner_email_id$$',	'',	'',	9,	'$$learner_username$$',	'Active',	'CK',	1,	1,	NULL,	'2025-04-01 02:20:20',	'2025-04-11 03:59:20'),
(11,	'Instructor Reset Password By Admin',	'Reset Password',	'<p>Dear $$instructor_name$$,</p><p>Your login credentials for accessing your account are as follows:</p><ul><li><strong>Username</strong>: $$instructor_username$$</li><li><strong>Password</strong>: ##$.password##</li><li><strong>URL</strong>: <a href=\"$$instructor_login_link$$\">Click Here</a></li></ul><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$instructor_email_id$$',	'',	'',	11,	'',	'Active',	'CK',	1,	2,	NULL,	'2025-04-03 01:43:33',	'2025-04-29 08:49:21'),
(12,	'Instructor Account Verification By Admin',	'Welcome to siberSIM - Account Activation Link',	'<p>Dear $$instructor_name$$,</p><p>Welcome to siberSIM!<br>Please click the link below to activate your account:</p><p><a href=\"$$instructor_verification_link$$\"><strong>Click here to verify your account</strong></a></p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$instructor_email_id$$',	'',	'',	12,	'',	'Active',	'CK',	1,	2,	NULL,	'2025-04-03 01:43:33',	'2025-04-29 08:49:46'),
(13,	'Instructor Sign Up - Welcome Mail',	'Welcome to siberSIM - Your Learning Journey Begins!',	'<p>Dear $$instructor_name$$,</p><p>Congratulations! You\'ve officially joined the dynamic team of learners at<strong> siberSIM</strong>. We\'re thrilled to have you on board and look forward to the positive impact we know you\'ll make.&nbsp;</p><p>Your login credentials for accessing your account are as follows:</p><ul><li><strong>Username</strong>: $$instructor_username$$</li><li><strong>Password</strong>: ##$.password##</li></ul><p>Please click the link below to activate your account:</p><p><a href=\"$$instructor_verification_link$$\"><strong>Click here to verify your account</strong></a></p><p>We\'re confident that your contributions will enrich our learning community, and we\'re excited to witness your growth and success.</p><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$instructor_email_id$$',	'',	'',	13,	'',	'Active',	'CK',	1,	2,	'2025-04-10 03:58:40',	'2025-04-10 03:58:40',	'2025-04-29 09:02:28'),
(15,	'Learner Reset Password By Admin',	'Reset Password',	'<p>Dear $$learner_name$$,</p><p>Your login credentials for accessing your account are as follows:</p><ul><li><strong>Username</strong>: $$learner_username$$</li><li><strong>Password</strong>: ##$.password##</li></ul><p>&nbsp;&nbsp;<strong> &nbsp;</strong><a href=\"$$learner_login_link$$\"><strong>Click Here</strong></a> to go to login panel</p><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$learner_email_id$$',	'',	'',	16,	'',	'Active',	'CK',	2,	2,	NULL,	'2025-04-14 01:29:16',	'2025-04-29 09:00:55'),
(16,	'Learner Account Verification By Admin',	'Welcome to siberSIM - Account Activation Link',	'<p>Dear $$learner_name$$,</p><p>Welcome to siberSIM!<br>Please click the link below to activate your account:</p><p><a href=\"$$learner_verification_link$$\"><strong>Click here to verify your account</strong></a></p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$learner_email_id$$',	'',	'',	10,	'',	'Active',	'CK',	2,	1,	NULL,	'2025-04-16 02:15:38',	'2025-04-24 03:04:45'),
(17,	'User & Instructor Reset Password',	'Reset Password',	'<p>Dear $$user_name$$,</p><p>Your login credentials for accessing your account are as follows:</p><ul><li><strong>Username</strong>: $$user_username$$</li><li><strong>Password</strong>: ##$.password##</li><li><strong>URL</strong>: <a href=\"$$user_login_link$$\">Click Here</a></li></ul><p>Best regards,<br><strong>$$regards_name$$</strong></p>',	'$$user_email_id$$',	'',	'',	17,	'',	'Active',	'CK',	2,	2,	NULL,	'2025-04-17 02:39:50',	'2025-04-29 09:02:45'),
(18,	'Proxmox Down Alert Mail',	'Urgent: Proxmox Server Down – Immediate Action Required',	'<p>Dear Team,</p><p>This is a system-generated alert to inform you that the <b>Proxmox server is currently down</b>.</p><p>Downtime Detected: <b>##$.downdatetime##</b>.</p><p>Please check and restart the server at the earliest.<br>Kindly treat this as high priority and take immediate action.</p>\r\n<p>Best regards,<br<strong>$$regards_name$$</strong></p>',	'$$proxmox_email_sent$$',	'',	'',	17,	'',	'Active',	'CK',	2,	2,	NULL,	'2025-04-17 02:39:50',	'2025-04-29 09:02:45'),
(19,	'License Key for Account Activation / Upgrade',	'siberSIM : Your License Key for Account Activation / Upgrade',	'<p>Dear $$customer_name$$,</p><p>Thank you for choosing our services.</p><p>Please find below your <strong>license key</strong> required to activate/upgrade your account:</p><p><strong>License Key:</strong> <strong>##$.license_key##</strong><br><strong>Start Date:</strong> ##$.start_date##<br><strong>Expiry Date :</strong> ##$.expiry_date##<br><strong>Number of Seats :</strong> ##$.sim_user_count##</p><p>Kindly use the above license key to activate your account. If you encounter any difficulties during the activation process, please feel free to reach out to our support team — we are always here to assist you.</p><p>Thank you for your trust and continued association with us.</p><p>Thank you for your continued trust.</p><p>Warm regards,<br>$$regards_name$$</p>',	'$$customer_email$$',	'$$admin_email$$',	'',	19,	'',	'Active',	'CK',	1,	1,	NULL,	'2025-11-20 09:31:48',	'2025-12-09 11:10:54');

DROP TABLE IF EXISTS `email_workflows`;
CREATE TABLE `email_workflows` (
  `workflow_id` int(11) NOT NULL AUTO_INCREMENT,
  `action_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `mailuser_id` int(11) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Inactive',
  `createdby` int(11) DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`workflow_id`)
);

INSERT INTO `email_workflows` (`workflow_id`, `action_id`, `template_id`, `mailuser_id`, `status`, `createdby`, `modifiedby`, `createdon`, `modifiedon`) VALUES
(1,	7,	7,	1,	'Active',	1,	NULL,	'2025-03-25 09:15:50',	NULL),
(2,	5,	5,	1,	'Active',	1,	NULL,	'2025-03-25 09:15:57',	NULL),
(3,	6,	6,	1,	'Active',	1,	NULL,	'2025-03-25 09:16:01',	NULL),
(4,	8,	8,	1,	'Active',	1,	NULL,	'2025-03-25 09:16:36',	NULL),
(5,	3,	3,	1,	'Active',	1,	NULL,	'2025-03-25 09:17:10',	NULL),
(6,	1,	1,	2,	'Active',	1,	NULL,	'2025-03-25 09:17:16',	NULL),
(7,	4,	4,	1,	'Active',	1,	NULL,	'2025-03-25 09:17:21',	NULL),
(8,	2,	2,	1,	'Active',	1,	NULL,	'2025-03-25 09:17:25',	NULL),
(9,	11,	11,	1,	'Active',	1,	NULL,	'2025-04-03 07:19:40',	NULL),
(15,	12,	12,	1,	'Active',	1,	NULL,	'2025-04-11 08:20:10',	NULL),
(16,	13,	13,	1,	'Active',	1,	NULL,	'2025-04-11 08:20:18',	NULL),
(17,	16,	15,	1,	'Active',	2,	NULL,	'2025-04-14 07:15:26',	NULL),
(18,	10,	10,	1,	'Inactive',	2,	2,	'2025-04-16 07:38:03',	'2025-04-17 09:12:05'),
(19,	10,	16,	1,	'Active',	2,	2,	'2025-04-17 01:57:26',	'2025-04-17 09:13:17'),
(20,	17,	17,	1,	'Active',	2,	2,	'2025-04-17 01:57:26',	'2025-04-17 02:45:54'),
(21,	18,	18,	1,	'Active',	2,	2,	'2025-04-17 01:57:26',	'2025-04-17 02:45:54'),
(22,	19,	19,	1,	'Active',	1,	NULL,	'2025-12-09 11:17:36',	NULL);

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `eventid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `eventuuid` char(36) NOT NULL COMMENT 'Event Unique Id',
  `eventname` varchar(100) NOT NULL COMMENT 'Event Name',
  `eventdescription` text NOT NULL COMMENT 'Event Description',
  `scenarioid` int(11) NOT NULL COMMENT 'Scenario Id',
  `eventstarttime` datetime DEFAULT NULL COMMENT 'Event Start time',
  `eventendtime` datetime DEFAULT NULL COMMENT 'Event End time',
  `status` enum('Pending','Running','Completed') NOT NULL DEFAULT 'Pending' COMMENT 'Status',
  `createdby` int(11) DEFAULT NULL COMMENT 'Created By Id',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Modified On',
  PRIMARY KEY (`eventid`)
);


DROP TABLE IF EXISTS `event_learners`;
CREATE TABLE `event_learners` (
  `eventlearnerid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Learner Event Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `eventid` int(11) NOT NULL COMMENT 'Event Id',
  `team_name` varchar(255) NOT NULL COMMENT 'Team Name',
  `team_description` text NOT NULL COMMENT 'Team Description',
  `scenariodiagram` longtext DEFAULT NULL COMMENT 'Scenario Diagram',
  `network_bridges` longtext DEFAULT NULL COMMENT 'Network Brigde',
  `status` enum('Pending','Initializing','Failed','Start','Pause','Resume','Terminated','Completed') DEFAULT 'Pending' COMMENT 'Status',
  `ranking` int(11) DEFAULT NULL,
  `vm_steps` enum('Pending','Initializing','Cloning','Bridge Configuration','Starting','Running','Stopped','Destroyed','Failed','Operation Failed') DEFAULT 'Pending',
  `Loggedon` timestamp NULL DEFAULT NULL COMMENT 'Login On',
  `startedon` timestamp NULL DEFAULT NULL COMMENT 'Started On',
  `completedon` timestamp NULL DEFAULT NULL COMMENT 'Completed On',
  `timer` time DEFAULT NULL COMMENT 'Timer',
  `createdby` int(11) DEFAULT NULL COMMENT 'Created By',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By',
  `failedon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`eventlearnerid`)
);


DROP TABLE IF EXISTS `event_learner_chats`;
CREATE TABLE `event_learner_chats` (
  `eventlearnerchatid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `eventlearnerid` int(11) NOT NULL COMMENT 'Event Learner Id',
  `eventid` int(11) NOT NULL COMMENT 'Event Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `instructor_id` int(11) NOT NULL COMMENT 'Instructor Id',
  `sender_type` enum('Learner','Instructor','Admin') NOT NULL COMMENT 'Sender Type',
  `message` text NOT NULL COMMENT 'Message',
  `attachment` text DEFAULT NULL COMMENT 'Attachment',
  `status` enum('sent','seen') NOT NULL COMMENT 'Status',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Created On',
  PRIMARY KEY (`eventlearnerchatid`)
);


DROP TABLE IF EXISTS `event_learner_logs`;
CREATE TABLE `event_learner_logs` (
  `eventlearnerlogsid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `eventlearnerid` int(11) NOT NULL COMMENT 'event learner id',
  `eventid` int(11) NOT NULL COMMENT 'event id',
  `learner_id` int(11) NOT NULL COMMENT 'learner id',
  `instructor_id` int(11) DEFAULT NULL COMMENT 'instructor id',
  `type` enum('Learner','Instructor','Admin','System') NOT NULL COMMENT 'type',
  `remark` text NOT NULL COMMENT 'remark',
  `status` enum('Start','Pause','Terminated','Resume','Completed','Failed','Initiated','Operation Failed') NOT NULL COMMENT 'status',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'createdon',
  PRIMARY KEY (`eventlearnerlogsid`)
);


DROP TABLE IF EXISTS `lab_sessions`;
CREATE TABLE `lab_sessions` (
  `labid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary ID',
  `labuuid` char(36) NOT NULL COMMENT 'Lab Unique Id',
  `bookingname` varchar(255) NOT NULL COMMENT 'Booking Name',
  `datetime` datetime NOT NULL COMMENT 'Date & Time',
  `duration` int(11) NOT NULL COMMENT 'Duration',
  `accesslevel` enum('simManager','simMaster') NOT NULL COMMENT 'Access Level',
  `personincharge` int(11) NOT NULL,
  `reservedseats` int(11) NOT NULL COMMENT 'Number of reserved seats',
  `allowedusers` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Based on the number of reserved seats selected',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  `createdby` int(11) DEFAULT NULL COMMENT 'Created By ID',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By ID',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`labid`)
);


DROP TABLE IF EXISTS `learners`;
CREATE TABLE `learners` (
  `learner_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary ID',
  `learner_uuid` char(36) NOT NULL COMMENT 'Unique Id For Record',
  `firstname` varchar(100) NOT NULL COMMENT 'Learner First Name',
  `lastname` varchar(100) DEFAULT NULL COMMENT 'Learner last Name',
  `email` varchar(100) NOT NULL COMMENT 'Learner Email',
  `mobile` varchar(100) DEFAULT NULL COMMENT 'Learner Mobile Number',
  `profile` text DEFAULT NULL COMMENT 'Profile Image',
  `username` varchar(100) NOT NULL COMMENT 'User Name',
  `password` varchar(255) NOT NULL COMMENT 'Learner Panel Password',
  `instructor_id` int(11) NOT NULL DEFAULT 2 COMMENT 'Instructor Id',
  `theme_preference` enum('dark','light') NOT NULL DEFAULT 'dark' COMMENT 'Theme preference',
  `otp` int(11) DEFAULT NULL COMMENT 'Login OTP',
  `otptimeout` timestamp NULL DEFAULT NULL COMMENT 'Login OTP Timeout',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  `isverified` enum('Yes','No') NOT NULL DEFAULT 'No' COMMENT 'To check mail confirmation',
  `createdby` int(11) DEFAULT NULL COMMENT 'Create By Id',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`learner_id`)
);


DROP TABLE IF EXISTS `learner_instructor_map`;
CREATE TABLE `learner_instructor_map` (
  `learnerinstructorid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `instructor_id` int(11) NOT NULL COMMENT 'Instructor Id (ad_user)',
  `createdby` int(11) DEFAULT NULL COMMENT 'Create By Id',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`learnerinstructorid`)
);


DROP TABLE IF EXISTS `learner_refresh_tokens`;
CREATE TABLE `learner_refresh_tokens` (
  `refreshtokenid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner ID',
  `access_token` text NOT NULL COMMENT 'Access Token',
  `refresh_token` text NOT NULL COMMENT 'Refresh Token',
  `token_json` longtext DEFAULT NULL COMMENT 'Token Json',
  `logged_in` timestamp NULL DEFAULT NULL,
  `logged_out` timestamp NULL DEFAULT NULL,
  `is_valid` tinyint(1) DEFAULT NULL COMMENT 'Is Valid',
  `createdon` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Created On',
  PRIMARY KEY (`refreshtokenid`)
);


DROP TABLE IF EXISTS `license_logs`;
CREATE TABLE `license_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `license_key` varchar(255) NOT NULL COMMENT 'License Key',
  `createdby` int(11) DEFAULT NULL COMMENT 'Created by ID',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created date',
  PRIMARY KEY (`id`)
);


DROP TABLE IF EXISTS `log_errors`;
CREATE TABLE `log_errors` (
  `logerrorid` int(11) NOT NULL AUTO_INCREMENT,
  `error_message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`error_message`)),
  `createdon` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`logerrorid`)
);


DROP TABLE IF EXISTS `mst_faqs`;
CREATE TABLE `mst_faqs` (
  `faq_id` int(11) NOT NULL AUTO_INCREMENT,
  `question` varchar(255) NOT NULL,
  `answer` text NOT NULL,
  `order_by` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `type` enum('User','Instructor','Admin') NOT NULL DEFAULT 'User',
  `createdby` int(11) DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`faq_id`)
);


DROP TABLE IF EXISTS `networks`;
CREATE TABLE `networks` (
  `networkid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Network ID',
  `networkname` varchar(100) NOT NULL COMMENT 'Network Name',
  `networkjson` longtext NOT NULL COMMENT 'Network Json',
  `issync` enum('Yes','No') NOT NULL DEFAULT 'Yes' COMMENT 'Sync Network',
  `status` enum('Available','Occupied','In Use','Destroyed') NOT NULL DEFAULT 'Available' COMMENT 'Status',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created On',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`networkid`)
);


DROP TABLE IF EXISTS `noti_logs`;
CREATE TABLE `noti_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_action` varchar(255) NOT NULL COMMENT 'template id',
  `type` enum('Admin','Instructor','Learner','Event','System') NOT NULL DEFAULT 'Learner',
  `type_id` int(11) NOT NULL COMMENT 'tutor or user id',
  `body` text DEFAULT NULL,
  `link` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `is_read` tinyint(4) NOT NULL DEFAULT 0 COMMENT '1 for Read, 0 for Unread',
  `is_processing` enum('Y','N') NOT NULL DEFAULT 'N' COMMENT 'Y for Proceed, N for Unproceed',
  `createdon` timestamp NULL DEFAULT NULL,
  `processon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`log_id`)
);


DROP TABLE IF EXISTS `noti_templates`;
CREATE TABLE `noti_templates` (
  `template_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(255) NOT NULL,
  `template_action` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `link` text NOT NULL,
  `payloads` text NOT NULL,
  `static_payloads` text DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `createdby` int(11) DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`template_id`)
);

INSERT INTO `noti_templates` (`template_id`, `template_name`, `template_action`, `body`, `link`, `payloads`, `static_payloads`, `status`, `createdby`, `modifiedby`, `deletedon`, `createdon`, `modifiedon`) VALUES
(1,	'Welcome To siberSIM',	'welcome_learner',	'Hello $$learner_name$$! 🎉 Welcome to siberSIM! We\'re delighted to have you on board.',	'',	'learner_id',	'',	'Active',	1,	1,	NULL,	'2024-03-04 11:23:55',	'2024-10-25 05:41:09'),
(2,	'Welcome To siberSIM',	'welcome_instructor',	'Hello $$instructor_name$$! 🎉 Welcome to siberSIM! We\'re delighted to have you on board.',	'',	'instructor_id',	NULL,	'Active',	1,	1,	NULL,	'2025-06-26 06:36:32',	NULL),
(3,	'New Scenario Released',	'publish_scenario',	'🆕 New Scenario Published: \"$$scenariotitle$$\" is now available! 🚀🖥️',	'',	'scenarioid',	NULL,	'Active',	2,	NULL,	NULL,	'2025-06-26 10:08:52',	NULL),
(4,	'Proxmox Down',	'proxmox_down',	'🔴 siberSIM virtual environment is currently down Please try again in a little while. We\'re working to restore it as soon as possible.',	'',	'{\"learner_id\":0,\r\n\"userid\":0}',	NULL,	'Active',	2,	NULL,	NULL,	'2025-06-26 10:08:52',	NULL),
(5,	'Proxmox Terminate',	'proxmox_terminate',	'🔴 We were unable to terminate this scenario - \"$$scenariotitle$$\" on the siberSIM Virtual Environment due to an unexpected issue from learner - $$learner_name$$!.',	'',	'{\"userid\":0,scenarioid,learner_id}',	NULL,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(6,	'Scenario Approval',	'scenario_approval',	'$$learner_name$$ published a new scenario $$scenariotitle$$. Please review and approve or reject.',	'',	'{\"userid\":0,scenarioid,learner_id}',	NULL,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(7,	'Scenario Status Notification',	'scenario_status_notification',	'Hello $$learner_name$$,Your scenario $$scenariotitle$$ has been $$status$$.  ',	'',	'{\"userid\":0,scenarioid,learner_id}',	NULL,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(8,	'Scenario Approval',	'scenario_approval',	'$$learner_name$$ published a new scenario $$scenariotitle$$. Please review and approve or reject.',	'',	'{\"userid\":0,scenarioid,learner_id}',	NULL,	'Active',	1,	NULL,	NULL,	NULL,	NULL),
(9,	'Scenario Status Notification',	'scenario_status_notification',	'Hello $$learner_name$$, your scenario $$scenariotitle$$ has been $$status$$.',	'',	'{\"userid\":0,scenarioid,learner_id}',	NULL,	'Active',	1,	NULL,	NULL,	NULL,	NULL),
(10,	'Component Approval',	'component _approval',	'$$learner_name$$ created a new component $$component title$$. Please review and approve or reject.',	'',	'{\"userid\":0,componentid,learner_id}',	NULL,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL),
(11,	'Component  Status Notification',	'component_status_notification',	'Hello $$learner_name$$,Your component $$componenttitle$$ has been $$status$$.  ',	'',	'{\"userid\":0,componentid,learner_id}',	NULL,	'Active',	NULL,	NULL,	NULL,	NULL,	NULL);

DROP TABLE IF EXISTS `scenarios`;
CREATE TABLE `scenarios` (
  `scenarioid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `scenariouuid` char(36) NOT NULL DEFAULT uuid() COMMENT 'Scenario Unique Id',
  `scenariotitle` tinytext NOT NULL COMMENT 'Scenario Title',
  `scenarioidentification` varchar(100) NOT NULL COMMENT 'Scenario Identification',
  `scenariodescription` text DEFAULT NULL COMMENT 'Scenario Description',
  `scenariolevel` enum('Easy','Medium','Hard') NOT NULL DEFAULT 'Easy' COMMENT 'Scenario Level',
  `scenariocategoryid` int(11) NOT NULL COMMENT 'Scenario Category Id',
  `scenariosubcategoryid` int(11) NOT NULL COMMENT 'Scenario Subcategory Id',
  `instructor_id` int(11) DEFAULT NULL COMMENT 'Create By Instructor Id',
  `learner_id` int(11) DEFAULT NULL COMMENT 'Create By Learner Id',
  `scenario_type` enum('Public','Private') DEFAULT 'Public' COMMENT 'Scenario Type - Public | Private',
  `scenarioimage` text DEFAULT NULL COMMENT 'Scenario Image',
  `scenariodiagram` longtext DEFAULT NULL COMMENT 'Scenario Diagram',
  `components` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Used Components',
  `component_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Component Config',
  `network_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Network Config',
  `instruction_file` varchar(255) DEFAULT NULL COMMENT 'Instruction File',
  `duration` bigint(20) DEFAULT NULL COMMENT 'Duration in minute',
  `scenariostatus` enum('Draft','Publish') NOT NULL DEFAULT 'Draft' COMMENT 'Scenario Status ',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  `publishedon` datetime DEFAULT NULL COMMENT 'published On',
  `createdby` int(11) DEFAULT NULL COMMENT 'Created By Id',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On',
  PRIMARY KEY (`scenarioid`)
);


DROP TABLE IF EXISTS `scenario_categories`;
CREATE TABLE `scenario_categories` (
  `scenariocategoryid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `scenariocategoryuuid` char(36) NOT NULL DEFAULT uuid() COMMENT 'Scenario Category Unique Id',
  `parentscenariocategoryid` int(11) DEFAULT NULL COMMENT 'Parent Scenario Category Id',
  `categoryname` varchar(100) NOT NULL COMMENT 'Scenario Category Name',
  `categoryimage` text DEFAULT NULL COMMENT 'Scenario Category Image',
  `categorytype` enum('Public','Private') DEFAULT 'Public',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  `createdby` int(11) NOT NULL COMMENT 'Create By Id',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Created On',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified By Id',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Created On',
  PRIMARY KEY (`scenariocategoryid`)
);


DROP TABLE IF EXISTS `scenario_export`;
CREATE TABLE `scenario_export` (
  `exportid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'scenario export Id',
  `scenarioid` int(11) NOT NULL COMMENT 'scenarioi d',
  `userid` int(11) DEFAULT NULL COMMENT 'user id',
  `learner_id` int(11) DEFAULT NULL COMMENT 'learner_id',
  `status` enum('Inprogress','Failed','Running','Complete') NOT NULL DEFAULT 'Inprogress' COMMENT 'Status',
  `file_name` varchar(255) DEFAULT NULL COMMENT 'File name',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'createdon',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'modifiedon',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'deletedon',
  PRIMARY KEY (`exportid`)
);


DROP TABLE IF EXISTS `scenario_learner`;
CREATE TABLE `scenario_learner` (
  `scenariolearnerid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `scenariolearneruuid` char(36) NOT NULL COMMENT 'Scenario Learner Unique Id',
  `scenarioid` int(11) NOT NULL COMMENT 'Scenario Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `instructor_id` int(11) NOT NULL COMMENT 'student instructorid ',
  `currentsession_id` int(11) DEFAULT NULL COMMENT 'Current Session Id',
  `status` enum('Initializing','Running','Terminated','Completed','Pause') NOT NULL DEFAULT 'Initializing' COMMENT 'Status',
  `createdon` timestamp NULL DEFAULT NULL COMMENT 'Created On',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  PRIMARY KEY (`scenariolearnerid`)
);


DROP TABLE IF EXISTS `scenario_learner_chats`;
CREATE TABLE `scenario_learner_chats` (
  `scenariolearnerchatid` int(11) NOT NULL AUTO_INCREMENT,
  `scenariolearnerid` int(11) NOT NULL COMMENT 'Scenarios Learner Id',
  `scenarioid` int(11) NOT NULL COMMENT 'Scenario  Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `instructor_id` int(11) NOT NULL COMMENT 'Instructor Id',
  `sender_type` enum('Learner','Instructor','Admin') NOT NULL COMMENT 'Sender Type',
  `message` text NOT NULL COMMENT 'Message',
  `attachment` text DEFAULT NULL COMMENT 'Attachment',
  `status` enum('sent','seen') NOT NULL DEFAULT 'sent' COMMENT 'Status',
  `createdon` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Created On',
  PRIMARY KEY (`scenariolearnerchatid`),
  KEY `scenarioid` (`scenarioid`),
  KEY `learner_id` (`learner_id`),
  KEY `instructor_id` (`instructor_id`)
);


DROP TABLE IF EXISTS `scenario_learner_logs`;
CREATE TABLE `scenario_learner_logs` (
  `scenariolearnerlogid` int(11) NOT NULL AUTO_INCREMENT,
  `scenariolearnersessionid` int(11) NOT NULL COMMENT 'Scenario Session Id',
  `scenarioid` int(11) NOT NULL COMMENT 'Scenario Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `scenariolearnerid` int(11) NOT NULL,
  `instructor_id` int(11) DEFAULT NULL COMMENT 'Instructor Id',
  `type` enum('Learner','Instructor','Admin','System') NOT NULL COMMENT 'Stakeholder',
  `remark` text NOT NULL COMMENT 'Remark',
  `status` enum('Start','Pause','Resume','Terminated','Completed','Failed','Initiated','Operation Failed') NOT NULL COMMENT 'Status',
  `createdon` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`scenariolearnerlogid`)
);


DROP TABLE IF EXISTS `scenario_learner_quiz`;
CREATE TABLE `scenario_learner_quiz` (
  `scenariolearnarquizid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `scenariolearnerid` int(11) DEFAULT NULL COMMENT 'Scenario Learner Id',
  `scenarioid` int(11) NOT NULL COMMENT 'Scenario Id',
  `learner_id` int(11) NOT NULL COMMENT 'learner Id',
  `startedon` datetime NOT NULL COMMENT 'Quiz Start Date',
  `endedon` datetime NOT NULL COMMENT 'Quiz End Date',
  `status` enum('Pending','Running','Completed') NOT NULL DEFAULT 'Pending' COMMENT 'Quiz Status',
  `timer` time DEFAULT NULL COMMENT 'Quiz Timer',
  `total_questions` bigint(20) NOT NULL COMMENT 'Total number of question',
  `total_answers` bigint(20) NOT NULL,
  `total_correct_answers` bigint(20) NOT NULL COMMENT 'Correct Answer',
  PRIMARY KEY (`scenariolearnarquizid`)
);


DROP TABLE IF EXISTS `scenario_learner_quiz_data`;
CREATE TABLE `scenario_learner_quiz_data` (
  `scenariolearnarquizdataid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `scenariolearnarquizid` int(11) NOT NULL COMMENT 'Scenario learner quiz Id',
  `scenarioquestionid` int(11) NOT NULL,
  `question_text` longtext NOT NULL,
  `answer_array` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`answer_array`)),
  `correctanswerid` varchar(200) NOT NULL,
  `learneranswerids` varchar(200) NOT NULL,
  `status` enum('Pending','Pass','Fail') NOT NULL DEFAULT 'Pending',
  `createdon` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`scenariolearnarquizdataid`)
);


DROP TABLE IF EXISTS `scenario_learner_session`;
CREATE TABLE `scenario_learner_session` (
  `scenariolearnersessionid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `scenariolearnersessionuuid` char(36) NOT NULL COMMENT 'Unique Id',
  `scenariolearnerid` int(11) NOT NULL COMMENT 'Scenario Learner Id',
  `scenarioid` int(11) NOT NULL COMMENT 'Scenario Id',
  `learner_id` int(11) NOT NULL COMMENT 'Learner Id',
  `scenariodiagram` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Scenario Diagram Id',
  `url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `network_bridges` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `timer` time DEFAULT NULL COMMENT 'Session Timer',
  `isnotitermination` enum('Yes','No') DEFAULT 'No' COMMENT 'Termination Notification',
  `status` enum('Initializing','Failed','Start','Pause','Resume','Terminated','Completed') NOT NULL DEFAULT 'Initializing' COMMENT 'Status',
  `vm_steps` enum('Initializing','Cloning','Bridge Configuration','Starting','Running','Stopped','Destroyed','Failed','Operation Failed') NOT NULL DEFAULT 'Initializing' COMMENT 'VM Steps',
  `startedon` timestamp NULL DEFAULT NULL COMMENT 'Started On',
  `resumeon` timestamp NULL DEFAULT NULL,
  `terminatedon` timestamp NULL DEFAULT NULL COMMENT 'Terminated On',
  `completedon` timestamp NULL DEFAULT NULL COMMENT 'Completed On',
  `failedon` timestamp NULL DEFAULT NULL COMMENT 'Failed On',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  PRIMARY KEY (`scenariolearnersessionid`)
);


DROP TABLE IF EXISTS `scenario_questions`;
CREATE TABLE `scenario_questions` (
  `scenarioquestionid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `scenarioquestionuuid` char(36) NOT NULL COMMENT 'Unique ID',
  `scenarioid` int(11) NOT NULL COMMENT 'Scenario Id',
  `question_type` enum('SCQ','MCQ','Descriptive') NOT NULL DEFAULT 'SCQ' COMMENT 'Question type',
  `question_text` longtext NOT NULL COMMENT 'Question',
  `added_by` enum('Admin','Instructor') NOT NULL DEFAULT 'Admin' COMMENT 'Added By',
  `difficulty_level` enum('Easy','Medium','Hard') NOT NULL DEFAULT 'Medium' COMMENT 'Level',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
  `createdby` int(11) NOT NULL COMMENT 'Created by',
  `createdon` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Created on',
  `modifiedby` int(11) DEFAULT NULL COMMENT 'Modified by',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified on',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted on',
  PRIMARY KEY (`scenarioquestionid`)
);


DROP TABLE IF EXISTS `scenario_question_answers`;
CREATE TABLE `scenario_question_answers` (
  `scenarioquestionanswerid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `scenarioquestionid` int(11) NOT NULL COMMENT 'Question ID',
  `answer_text` longtext NOT NULL COMMENT 'Answer',
  `is_correct` enum('Yes','No') NOT NULL DEFAULT 'No' COMMENT 'Is Correct',
  `status` enum('Active','Inactive') DEFAULT 'Active' COMMENT 'Status',
  `createdon` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Created on',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified on',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted on',
  PRIMARY KEY (`scenarioquestionanswerid`)
);


DROP TABLE IF EXISTS `scenario_tabs`;
CREATE TABLE `scenario_tabs` (
  `scenariotabid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `tab_name` varchar(100) NOT NULL COMMENT 'Tab Name',
  `tab_status` enum('True','False') NOT NULL DEFAULT 'True' COMMENT 'Tab Status',
  `event_status` enum('True','False') NOT NULL DEFAULT 'True' COMMENT 'Event Status',
  `tab_type` enum('Fixed','Flexible') NOT NULL DEFAULT 'Fixed' COMMENT 'Tab Type',
  `widget_url` varchar(255) DEFAULT NULL,
  `tab_ordering` int(11) NOT NULL COMMENT 'Tab Ordering',
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`scenariotabid`)
);

INSERT INTO `scenario_tabs` (`scenariotabid`, `tab_name`, `tab_status`, `event_status`, `tab_type`, `widget_url`, `tab_ordering`, `createdon`, `modifiedon`, `deletedon`) VALUES
(1,	'Basic Information',	'True',	'True',	'Fixed',	NULL,	1,	'2025-11-07 13:22:46',	'2025-12-16 07:32:12',	NULL),
(2,	'Instruction Details',	'True',	'False',	'Fixed',	NULL,	5,	'2025-11-07 12:51:26',	'2025-12-16 07:32:12',	NULL),
(3,	'Scenario Diagram',	'True',	'True',	'Fixed',	NULL,	2,	'2025-11-07 12:52:38',	'2025-12-16 07:32:12',	NULL),
(4,	'Quiz',	'True',	'False',	'Fixed',	NULL,	6,	'2025-11-07 12:56:06',	'2025-12-16 07:32:12',	NULL),
(5,	'Logs',	'False',	'False',	'Fixed',	NULL,	4,	'2025-11-07 13:22:35',	'2025-12-16 07:32:13',	NULL),
(6,	'Dynamic Tabs',	'True',	'False',	'Flexible',	'https://velas.bold-themes.com/rental-velas/home/home-02/',	3,	'2025-11-07 13:24:29',	'2025-12-16 07:32:13',	NULL);

DROP TABLE IF EXISTS `sc_configurations`;
CREATE TABLE `sc_configurations` (
  `configuration_id` int(11) NOT NULL AUTO_INCREMENT,
  `service_type_id` int(11) NOT NULL,
  `config_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config_values`)),
  `createdby` int(11) NOT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `createdon` datetime DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`configuration_id`)
);

INSERT INTO `sc_configurations` (`configuration_id`, `service_type_id`, `config_values`, `createdby`, `modifiedby`, `createdon`, `modifiedon`) VALUES
(2,	1,	'{\"smtp_host\":\"smtp.office365.com\",\"smtp_port\":\"587\"}',	1,	1,	'2023-12-05 06:53:13',	'2024-09-17 08:04:01');

DROP TABLE IF EXISTS `sc_mailusers`;
CREATE TABLE `sc_mailusers` (
  `mailuser_id` int(11) NOT NULL AUTO_INCREMENT,
  `service_type_id` int(11) NOT NULL,
  `smtp_username` varchar(255) NOT NULL,
  `smtp_password` text NOT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `sender_emailid` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `createdby` int(11) NOT NULL,
  `createdon` datetime DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  `deletedon` datetime DEFAULT NULL,
  PRIMARY KEY (`mailuser_id`)
);

INSERT INTO `sc_mailusers` (`mailuser_id`, `service_type_id`, `smtp_username`, `smtp_password`, `sender_name`, `sender_emailid`, `status`, `createdby`, `createdon`, `modifiedby`, `modifiedon`, `deletedon`) VALUES
(1,	1,	'coding@technobase.in',	'Tbs@2023',	'TBS Project Manager',	'coding@technobase.in',	'Active',	1,	'2023-12-11 06:19:47',	1,	'2024-09-17 08:13:46',	NULL),
(2,	1,	'pendekar@battlerangers.com',	'Sysadmin12345@',	'pendekar@battlerangers.com',	'pendekar@battlerangers.com',	'Active',	1,	'2023-12-11 06:19:47',	1,	'2024-09-17 08:13:46',	NULL);

DROP TABLE IF EXISTS `sc_servicetypes`;
CREATE TABLE `sc_servicetypes` (
  `service_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `orgid` int(11) NOT NULL DEFAULT 1,
  `type` varchar(150) NOT NULL,
  `service` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `form_payloads` longtext NOT NULL,
  `service_icon` text NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `is_default` enum('Y','N') NOT NULL DEFAULT 'N',
  `modifiedby` int(11) NOT NULL,
  `modifiedon` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`service_type_id`)
);

INSERT INTO `sc_servicetypes` (`service_type_id`, `orgid`, `type`, `service`, `description`, `form_payloads`, `service_icon`, `status`, `is_default`, `modifiedby`, `modifiedon`) VALUES
(1,	1,	'Mail',	'Office 365',	'',	'[{\"id\":\"smtp_host\",\"name\":\"smtp_host\",\"label\":\"SMTP Host\",\"placeholder\":\"Enter SMTP Host\",\"type\":\"text\",\"is_required\":true},{\"id\":\"smtp_port\",\"name\":\"smtp_port\",\"label\":\"SMTP Port\",\"placeholder\":\"Enter SMTP Port\",\"type\":\"text\",\"is_required\":true}]\r\n',	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAA1CAYAAAAHz2g0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAA4dSURBVGhDrVkLsBTFFe2emd19H4mAyEclgIQolij+gIokqWgI4ZNU1PiNKCEmVGHE0qjok48KEtSKBtQKUoASUSNlQI0QRIMCmqCiJhqRmAAPUEE+onzee7szO5NzbnfP7vKR37vs3dtzp6f7nHtv9/Q+tGpG6XvV/JZ+rvp87eeG6SBzqtZ+O7gDFehtyvdeCrL+vEUTe/zZ9G4eaTYC5131/OUFLxjjBdnuXlCtlBco7XlK+77SgQcaaHuYLlAfqKR43csTer5iHz0iOWICD45d0+2l+vfv2RpFP/IyVQFUeX4OQDPKI4kMwPskQvBQsZ7ytJ4baH3DgttPXm+HOiw5bAKPjV3fspgUf/XulnWj3tq0trWuqlVBtlZ5WUMAJQQFgQAZIAmJviFAMhqkQGQ3sjNet6n63cIhJ0R26EMSjHLoMmtsfT+tklc2N3x5z4qPV7aOVWLvOAvRAEtlxPFRPhSzEbyH0hJCnq5NtJqUbM+/139a/YXy3CEKhz5oeXz0mi6B508AzAtwWf3MqqVq7Y6tKqhqqfzyDARViDpKKIMMZAMTdUQ/Ecu1wOhbcrymBSEv681KwuTGhcM7f25mPLAcVAZm31Gfe3Jc/ciMF/wd010BWNVfNO5Sq7dusD3KIi9tKEcmUGZB2gDPRe2yYjJgFra1SaKuVlX+6gGPbxjFkQ5GDkjgiXHrvufF+lU/8SajCtoHOpGHPtm5RcVFV7YAIULwaMvHAmPpAHBigZarRJ4fXrMtxFTLxPMmDfjTp+8NmLOxrwz7FbJfAlNvXdlm9th1jwLTfEzVxwZRgHGeTbu2mY7ArFVs2kQjhkBMaSR4kFGnS5cGMdaRsO1yH0j1gF0ycN6mmT98emMbGXcfshcBlsv0MWt/mcsetbyo9FDgw6aeSGydsF0I8+YCcyYpcANWgCBTxoc2QXLXKQdpNfVZItydyjLC/fbnXm2wdtCCLVeZASulgsDUsfXH7YrV0lh707CzdCWESrWgaFGwewldjDZH5RcwCCH6HDHeE7DsA3U+Ae9I8dqq6XtUovWsgS9uWzbwL1u+AW8q7CIyZWz9twqJejNWuhcLwmhirWujJNA2M5fEecUtt/gFH8BI7Qt4umkNSCkdZsVE2jxiwMrOZNpW5Z0hz/RFNl4bvGjbmeglwu5qct1HXQsqmRdrdXxUAdooSgkKi6iTSFEiTeUXoRorUTYtTAaD0QUs3RaMvMA4qyWTkiovHd6XNhqy7dpxpL9qp7L+y4MWb/86ehkCjV5wJzC1LVrwJCGAU03go1+pEB3pi23QK4UTcCJGnwyMy0QYSgAWTAoUVsBV9Cmp9OWGQMs+kjWvlc75Uzm8N2nMmu8iwj9jVE20K0kQtCMSAU1o7wl+rgN8ZF6CcQtX9nu0HQB2wEc0vYa6++LDvXISzEg5OQFOS5VxBgyeu6mH1xgnPxbgmK+cBAGHe5Fw12nVy8QJ0pHgTOAcBC9vCwfGAWIds5v4rOXH9aGPANF24M2zTtGhvG+7mqvxjtL9HMAIqCIwEDIp2ESIMPIm+iViBo0FIJZqyGAN7MTt9QD4CSZrMDsT+pWTooug2LTAU7CuXwp+D+W9rHehh2h2M0BdlC0RS8KVEkGzT4H3oZIBW0ICmFFP9DYviO+Pc5kzPm0qdsx2bNF10S0nnZBVujXOQH1B4i5M3OSiL78TgEMAlRFLy4bXzoqiL89QskvxWX2cvnn0mhglhYDhMMVxOV6Zdc/jA8VbWKxSS1a9rj76bLUKqluobPXRDbqm5WO5qtp7l8zovw639yuXTPlvdler6gmxr2+WMiGY8oMdlW0CpL+MhGQaH1F+IYAetkXtIr1nzUu5IMIhyqo8Iy4DVIz6TjFbfV7XuHjDgcBT5ozsVlgw5IRbcrHqiQi+KWAkukYr6p5ZETIkai1V+uE22ighB9jsPga4AVmhQMv1YcorUdkgsznwghEdjs2dv+Lpy9944qmLWV0HLc9defy//npJh94A+wsAzafg8RECtARv/Q603KPaBa2vHb2a562KsuHTUj6w8ox4jHVtfA27fXyXR9k8UhnUb8LQ5Dt9HvXOPcuAdr/gYAW4KyVZJ3gAxpWAx4i7cnHKt21p9zE7UPl9UfsqaA7J7sorf/5iFU+eqZJt2y1QAsbNNHr4shmRlw4zUF5C5UrAhliJBAnhuFFBprkkh19xuSCnspsBftJUlTy7CCAKaek4sKKyA5EEHsQ9EDDA9gTv2u7Fxn6OkMtOc0ngZ1UmyGJdgQTUe3WFikdPUfHSt23EyxUPCBk0kCkhUFq4bs836kg4clSSIGESay7JZgA+A/DQHC1IBI2YefYLKpo4Q6n1Gw14rAXzmxptfEhGSshF2AAubaXmem/L+3md5GCaRYJsTYuszYJkwhLJwOf9b4MK6x5S8az5Sod47SLqaWlJBtI9vkQkj/iWan/fJPAS6UTTHFIdZDsJeJIQzdiSMmXF63jB66pw/e9V/P4aib7LglnEIMCXVXpUps9mwpXMniTyWn0bplnE9/yzTfQzEv3yTDgStN7mz1U4bpqKV5X+mCdrIMQBLAIbR0QywrYALy1es9gNmTDRfX5Tt0p+VByJ3HTZnB4ZP+gNlej7Hi0yAA1ESxnhThWg8KOxILHuM/MeCHEII1gDDIprIUKfzQojThJ8P5iyEht8pr07DYzDl6zW1/ieVxWAgO/7BrhE3WSEymspLfEjQwCUPDRXnjclBJVIMwuwBZAQImVZIRH8ZpayYt88jhN5pS+5oG5Vbw50ODJu6AvnVGdyIwQ8fsEFIODazETgMRMmAwGJ2EywtIJ1m5Rauc68iU1UDUiC5hqQrACkkLBZoa8JNxvwA2Y37u1OijWNSfy379e9fxIBHYpMGr74lGrPn+dpHRjAngDn300DS8BPiZEMVErKlFcG5PzlHyp9bt1/5CzERS0WKm9ynPHlpy3a4Aef2fuBW2ycxCBkNI7jTZmMP+SViae+jFtfKSPH/FN33LztDC+Jn4+KxeOLcVHBYgxYaBFtqrTlOoKN7D20E/blnEUVtqpVurclQJxy1kfDnfmdAnMZcKwGZgaacFCxMUCEvPeHlkEwaun9vXai615y34glbWt8fzz6DgPIgEAiAWhIFHFtwEcC0vio9hqWbf6EFSIAp8++bdVuvBxqHInUWuQ8s/EvEAkjTbBwkz0zIJaTcwJmA2B0XGyCc9RH0/pNQVeRu0csq2qTyw7E2NMA+BgHWsCyDRvaa+c3gO01lPM4Mgwg54Nt1Gfc9uEHidanELgrGbznZMdBPyCXjga8tDkwrAxkBpZMCBBkAW0V5el7u1Wm5tqb2nVuiONooipGg8ujTdJRxGtD3Pg4jgNq/FKm1s/sS/lYTPj3b6+QxMtksQIs9/c8LBamaoIvjwebnOLhJgzYBJBhMa8KsNQwKsjfScOwSRWhSaFBNYGAXyycdU5VbnlGq3cDpQbzCODhFwmDI8cB/OOClT+G8doqRcARpFwYtbdEOI5Rf5GXzaiprOMQD4AMCFCxlQI0CVALiBaBhrAGOK6LuC40peCpEYA3wvaoqlVjupyuBhzTEZPghx/B2cldw4Hdl/AeILgom38pEd5LxMa+P0dGOalu5cKwmPQnZ5YSU8TS0SwVDgISCipl42xkyiVhuTC1IHgc9ueL2ndWZ37tWLMAUSIsi7R0IlM6UjLOz9IRtT4pq3IfF7ApKZYPM8N0eJ4/+5H5w4cQL3666SsB5VMCZ5Td4KErEYDMQ2kl0ow62lHYIFHPod+l7buou07uo3q16iBDirgo2+iVNfDtbKmdGgbNRp/C9UcSxGd3wfp8Jiv/i5PmsduNK7o3au+tKIlruS1iN5HIJiDC6Gu2QQZhNRkAaDBQp3+ttbqmy2mqfbY6jZiLqmSA7dRXCk66iOW+9dk+9IW01u8WeTHmKzf5GC+5n05f+Os3iLuiEE++9d3uO5sKM/FwH1MyVBKAItJCBMBZPp1Q51d07q56Ht1WBQiUTJROaK2UDNshfNzXQ3tNv+tHLYF3bdmBEMgIoEvX0VtFrS+f9eLI1RZyJQEn37x++cgOgTd55c7tJupCIERWInViTa3q17aTOr9dZ5XDTpCCBTATTQcAbVkDBEoft8VKAlwThjRBkiD7GWIsZVru+7AbsdFMaGjZZvqef77ZJwHKT2avrx2+q82Mxnx06S5sjfzfng5V1eponEPMwAaIAN8LPCctA8S+bnHKc7bNZ4Skfd72dwTRpxBr/Uhjktw187lhWy20CtkvASfP3rP5B+1atJiKY28X9xIxBExbwMi1USFQBooRFEDloG10pS/8ofQzfdK+Sfwa9r4x3qmnL5kyvqdd3nvLAQk4eW3ylyPQ+QGQyMpuAAKclJaAxAogoxUgTTQNuArw+wAex1+A/O1bqmumz37iogP+te+gCVAW37+tZVwsPoBXyVAHnlaykQIyhBw4ASt9HEALnj7JlM1iHDfBN7cJB9bJcy6z/4d7YDkkAk7mTdjQN6OTh7FLncY9miDlZcOFasGKWqCVBCrLzpCJlyGr9+04sfMLD0/std9y2ZccFgEnc+9cPSIpFh8EGM+sDZ5Kca6iFdB4MRIs39QELgvZkLQlsxUHyd+GhfzMSXMu+8IOe0hyRAQoj4z6oG2Nl9yLk9zVLhsEaBa4aYuaSAtJlE2ErDzp5Wrq7pjR/xM71GHJERNwMmPUe32SsPBH7HzdTJShiHwK3JLAuf8fyvPvvuOxwfPto0ckzUaAct3od7zuOxoHAfAViPCZcRR2RjvG8WQ9SuoNHBWfaWza/erEpy7eYR85QlHq/xDqz93csHr0AAAAAElFTkSuQmCC',	'Active',	'N',	1,	'2025-03-25 09:11:50');

DROP TABLE IF EXISTS `vm_config`;
CREATE TABLE `vm_config` (
  `vmconfigurationid` int(11) NOT NULL AUTO_INCREMENT,
  `scenarioid` int(11) NOT NULL,
  `vmrequestid` int(11) NOT NULL,
  `componentid` int(11) NOT NULL,
  `nodeid` varchar(50) NOT NULL,
  `componenttype` enum('LXC','QEMU') NOT NULL DEFAULT 'LXC',
  `order` int(11) NOT NULL,
  `master_vmid` int(11) NOT NULL,
  `vmid` int(11) DEFAULT NULL,
  `componentname` varchar(255) NOT NULL,
  `duration` varchar(200) DEFAULT NULL,
  `network_bridge_json` varchar(200) DEFAULT NULL,
  `status` enum('Initializing','Cloning','Bridge Configuration','Starting','Running','Stopped','Destroyed','Failed','Operation Failed','Completed') NOT NULL DEFAULT 'Initializing',
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`vmconfigurationid`)
);


DROP TABLE IF EXISTS `vm_configuration`;
CREATE TABLE `vm_configuration` (
  `vmconfigurationid` int(11) NOT NULL AUTO_INCREMENT,
  `scenarioid` int(11) NOT NULL,
  `learner_id` int(11) NOT NULL,
  `type` enum('Learner','Event') NOT NULL DEFAULT 'Learner',
  `eventlearnerid` int(11) DEFAULT NULL,
  `scenariolearnerid` int(11) DEFAULT NULL,
  `scenariolearnersessionid` int(11) DEFAULT NULL,
  `componentid` int(11) NOT NULL,
  `nodeid` varchar(50) NOT NULL,
  `componenttype` enum('LXC','QEMU') NOT NULL DEFAULT 'LXC',
  `order` int(11) NOT NULL,
  `master_vmid` int(11) NOT NULL,
  `vmid` int(11) DEFAULT NULL,
  `componentname` varchar(255) NOT NULL,
  `duration` varchar(200) DEFAULT NULL COMMENT 'Configuration Delay',
  `network_bridge_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` enum('Initializing','Cloning','Bridge Configuration','Starting','Running','Stopped','Destroyed','Failed','Operation Failed','Completed') NOT NULL DEFAULT 'Initializing',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`vmconfigurationid`),
  KEY `scenarioid` (`scenarioid`),
  KEY `learner_id` (`learner_id`),
  KEY `scenariolearnerid` (`scenariolearnerid`),
  KEY `scenariolearnersessionid` (`scenariolearnersessionid`),
  CONSTRAINT `vm_configuration_ibfk_1` FOREIGN KEY (`scenarioid`) REFERENCES `scenarios` (`scenarioid`),
  CONSTRAINT `vm_configuration_ibfk_2` FOREIGN KEY (`learner_id`) REFERENCES `learners` (`learner_id`),
  CONSTRAINT `vm_configuration_ibfk_3` FOREIGN KEY (`scenariolearnerid`) REFERENCES `scenario_learner` (`scenariolearnerid`),
  CONSTRAINT `vm_configuration_ibfk_4` FOREIGN KEY (`scenariolearnersessionid`) REFERENCES `scenario_learner_session` (`scenariolearnersessionid`)
);


DROP TABLE IF EXISTS `vm_logs`;
CREATE TABLE `vm_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `api_end_point` varchar(500) DEFAULT NULL,
  `vm_process` varchar(100) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `request_datetime` datetime DEFAULT NULL,
  `response_datetime` datetime DEFAULT NULL,
  `response_code` varchar(100) DEFAULT NULL,
  `response` text DEFAULT NULL,
  `request_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_payload`)),
  `request_headers` text DEFAULT NULL,
  `duration` float DEFAULT NULL,
  `createdon` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);


DROP TABLE IF EXISTS `vm_request`;
CREATE TABLE `vm_request` (
  `vmrequestid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `scenarioid` int(11) NOT NULL COMMENT 'scenario id',
  `requestedby_id` int(11) NOT NULL,
  `requestedby_role` enum('Learner','Instructor','Admin','Event') NOT NULL DEFAULT 'Learner',
  `status` enum('Pending','Initializing','Running','Completed','Failed','Terminated','Pause','Resume') NOT NULL DEFAULT 'Initializing',
  `vm_steps` enum('Pending','Initializing','Cloning','bridge Configuration','starting','Running','stopped','Destroyed','Failed','Operation Failed') NOT NULL DEFAULT 'Initializing',
  `scenariodiagram` longtext DEFAULT NULL COMMENT 'Scenario Diagram ',
  `network_bridges` longtext DEFAULT NULL,
  `timer` time DEFAULT NULL COMMENT 'Session Timer',
  `isnotitermination` enum('Yes','No') DEFAULT 'No',
  `startedon` timestamp NULL DEFAULT NULL COMMENT 'started On',
  `completedon` timestamp NULL DEFAULT NULL COMMENT 'Completed On',
  `failedon` timestamp NULL DEFAULT NULL COMMENT 'Failed On',
  `terminatedon` timestamp NULL DEFAULT NULL COMMENT 'Terminated On',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'created On',
  `modifiedon` timestamp NULL DEFAULT NULL COMMENT 'Modified On',
  PRIMARY KEY (`vmrequestid`)
);


DROP TABLE IF EXISTS `vm_request_logs`;
CREATE TABLE `vm_request_logs` (
  `logid` int(11) NOT NULL AUTO_INCREMENT,
  `vmrequestid` int(11) NOT NULL,
  `scenarioid` int(11) NOT NULL,
  `requestedby_id` int(11) NOT NULL,
  `requestedby_role` enum('Learner','Instructor','Admin','Event','System') NOT NULL,
  `status` enum('Pending','Initializing','Running','Completed','Failed','Terminated','Pause','Resume') DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `createdon` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`logid`)
);


DROP TABLE IF EXISTS `vm_snapshots`;
CREATE TABLE `vm_snapshots` (
  `snapshotid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'SnapShot ID',
  `master_vmid` int(11) DEFAULT NULL COMMENT 'Master Vmid',
  `vmid` int(11) DEFAULT NULL COMMENT 'Clone Vmid',
  `learner_id` int(11) DEFAULT NULL COMMENT 'Learner Id',
  `scenarioid` int(11) DEFAULT NULL COMMENT 'Scenario Id',
  `component_type` enum('LXC','QEMU') DEFAULT 'LXC' COMMENT 'Component Type',
  `snapshot_name` varchar(255) NOT NULL COMMENT 'Snapshot Name',
  `snapshot_status` enum('Capture','Restore','Delete') NOT NULL DEFAULT 'Capture' COMMENT 'Snapshot Status',
  `createdon` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Created date tIme',
  `deletedon` timestamp NULL DEFAULT NULL COMMENT 'Deleted On ',
  PRIMARY KEY (`snapshotid`)
);


DROP TABLE IF EXISTS `web_browser_widgets`;
CREATE TABLE `web_browser_widgets` (
  `webbrowserwidgetid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Id',
  `widget_name` varchar(255) NOT NULL COMMENT 'Widget name',
  `widget_url` varchar(255) NOT NULL COMMENT 'Widget url',
  `order` int(11) NOT NULL COMMENT 'Order',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `createdby` int(11) DEFAULT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `deletedon` timestamp NULL DEFAULT NULL,
  `createdon` timestamp NULL DEFAULT NULL,
  `modifiedon` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`webbrowserwidgetid`)
);


DROP TABLE IF EXISTS `web_settings`;
CREATE TABLE `web_settings` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) NOT NULL,
  `company_id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(255) NOT NULL DEFAULT 'siberSIM' COMMENT 'Customer/Company Name',
  `phone_number` varchar(100) DEFAULT NULL COMMENT 'Customer/Company Phone Number',
  `email` varchar(100) DEFAULT NULL COMMENT 'Customer/Company Email',
  `address` text DEFAULT NULL COMMENT 'Customer/Company Address',
  `website` varchar(100) NOT NULL DEFAULT 'https://www.ofisgate.com/' COMMENT 'Website',
  `system_name` varchar(100) NOT NULL DEFAULT 'siberSIM' COMMENT 'System Name',
  `system_footer` varchar(100) NOT NULL DEFAULT 'Copyright © 2025 Ofisgate Sdn. Bhd. All rights reserved.' COMMENT 'System Footer',
  `domain_url` text NOT NULL COMMENT 'Host Name',
  `license_key` text NOT NULL COMMENT 'License Key',
  `otp_verification` enum('true','false') NOT NULL DEFAULT 'false' COMMENT 'Two Factor Authentication Required Or Not',
  `component_approval` enum('true','false') NOT NULL DEFAULT 'true',
  `base_clone_vmid` int(11) NOT NULL DEFAULT 10000 COMMENT 'Start Scenario Component From',
  `template_clone_vmid` int(11) NOT NULL DEFAULT 5000 COMMENT 'Create New Template Component From',
  `max_questions` int(11) NOT NULL DEFAULT 25 COMMENT 'Quiz Max Question Limit',
  `proxmox_alert_time` int(11) NOT NULL DEFAULT 120 COMMENT 'Proxmox Down Notification Delay Time  (In Min)',
  `proxmox_email_sent` text DEFAULT NULL COMMENT 'Proxmox Down Notification Send On Mail',
  `cloning_delay` int(11) NOT NULL DEFAULT 3 COMMENT 'Delay Bettwen Two Component Cloning (In Sec)',
  `configuration_delay` int(11) NOT NULL DEFAULT 10 COMMENT 'Delay Between After All Clone & Configuration Start (In Sec)',
  `termination_delay` int(11) NOT NULL DEFAULT 10 COMMENT 'Delay Between Stop & Destroy Proxmox API (In Sec)',
  `pause_limit` int(11) NOT NULL DEFAULT 5 COMMENT 'Max Hibernate Scenario Limit',
  `is_default_favicon` enum('true','false') NOT NULL DEFAULT 'true' COMMENT 'Default Favicon Flag',
  `is_default_ad_logo` enum('true','false') NOT NULL DEFAULT 'true' COMMENT 'Default Admin Logo Flag',
  `is_default_web_logo` enum('true','false') NOT NULL DEFAULT 'true' COMMENT 'Default Learner Logo Flag',
  `favicon` varchar(255) DEFAULT NULL COMMENT 'Favicon Image',
  `admin_panel_logo` varchar(255) DEFAULT NULL COMMENT 'Admin Logo Image',
  `web_panel_logo` varchar(255) DEFAULT NULL COMMENT 'Learner Logo Image',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1 for Active, 0 for Inactive, -1 for Delete',
  `createdby` int(11) NOT NULL,
  `modifiedby` int(11) DEFAULT NULL,
  `createdon` datetime NOT NULL,
  `modifiedon` datetime NOT NULL,
  PRIMARY KEY (`id`)
);

