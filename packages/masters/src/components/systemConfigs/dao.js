const { commonMsgs } = require('../../message');
const nodeMailer = require("nodemailer");

const systemconfigTypes = ({ db }) => async ({orgid}) => {
    let res = await db.sequelize.query(`SELECT act.*,ascs.config_values as form_value from sc_servicetypes act 
    left join sc_configurations ascs on ascs.service_type_id = act.service_type_id where act.orgid=${orgid}`,
    //----- For Fetch Single Record or handle json response
    { 
      type: db.sequelize.QueryTypes.SELECT
    }
    );
    let data = [];   
    let categories = [];   
    if(res.length > 0)
    {
        res.map((e,i)=>{ 
            if(!data.find((c)=>c.type == e.type))
            {  
                let obj = {'type':e.type,'description':e.description,'services':[]}
                data.push(obj);
                categories.push(e.type);
            }
        });
        data.map((c,j)=>{ 
            res.map((e,i)=>{ 
                if(c.type == e.type)
                {
                    let obj = {
                        "service_type_id":e.service_type_id,
                        "service":e.service,
                        "service_icon":e.service_icon,
                        "form_payloads":JSON.parse(e.form_payloads),
                        "form_value": e.form_value ? JSON.parse(e.form_value) : "",
                        "status":e.status,
                        "is_default":e.is_default,
                        "is_testshow": e.form_value ? true : false
                    }
                    data[j].services.push(obj);
                } 
            });
        });
    } 
    return {'data':data, 'categories': categories, 'message':commonMsgs.FETCH};
} 
 
const systemconfigSubmit = ({ db }) => async ({body,service_type_id,userid}) => {

    let checkexists = await db.sequelize.query(`SELECT config_values from sc_configurations where service_type_id = ?`,
        {   
            replacements: [service_type_id],
            type: db.sequelize.QueryTypes.SELECT
        }
    );
    if(checkexists.length > 0)
    {
        const updateQuery = `
            UPDATE sc_configurations
            SET modifiedon = CURRENT_TIMESTAMP, config_values = ?, modifiedby = ? WHERE service_type_id = ?
        `;
        const queryParams = [JSON.stringify(body), userid, service_type_id];
        try {
            await db.sequelize.query(updateQuery, {
                replacements: queryParams,
                type: db.sequelize.QueryTypes.UPDATE,
            });
            return {'statusCode':200, 'message': commonMsgs.UPDATE};
        } catch (error) {
            console.error('Error System Config Submit:', error);
            throw error;
        }
    }else{
        const insertQuery = `
            INSERT INTO sc_configurations (createdon, config_values, createdby, service_type_id) VALUES (CURRENT_TIMESTAMP, ?, ?, ?)
        `;
        const queryParams = [JSON.stringify(body), userid, service_type_id];
        try {
            await db.sequelize.query(insertQuery, {
                replacements: queryParams,
                type: db.sequelize.QueryTypes.INSERT,
            });
            return {'statusCode':200, 'message': commonMsgs.CREATE};
        } catch (error) {
            console.error('Error System Config Submit:', error);
            throw error;
        }
    }
}

const systemconfigDefaultUpdate = ({ db }) => async ({service_type_id,userid}) => {

    let checkexists = await db.sequelize.query(`SELECT type,orgid from sc_servicetypes where service_type_id = ?`,
        {   
            replacements: [service_type_id],
            type: db.sequelize.QueryTypes.SELECT
        }
    );
    if(checkexists.length > 0)
    {
        const updateQueryCurrent = `
            UPDATE sc_servicetypes
            SET modifiedon = CURRENT_TIMESTAMP, is_default = ?, modifiedby = ? WHERE service_type_id = ?
        `;
        const queryParams = ['Y', userid, service_type_id];
        try {
            // Update Current Check as 'Y'
            await db.sequelize.query(updateQueryCurrent, {
                replacements: queryParams,
                type: db.sequelize.QueryTypes.UPDATE,
            });
            const updateQueryOther = `
                UPDATE sc_servicetypes
                SET modifiedon = CURRENT_TIMESTAMP, is_default = ?, modifiedby = ? WHERE service_type_id != ? and type=? and orgid=?
            `;
            await db.sequelize.query(updateQueryOther, {
                replacements: ['N', userid, service_type_id, checkexists[0].type, checkexists[0].orgid],
                type: db.sequelize.QueryTypes.UPDATE,
            });

            return {'statusCode':200, 'message': commonMsgs.UPDATE};
        } catch (error) {
            console.error('Error System Config Submit:', error);
            throw error;
        }
    }else{
         return {'statusCode':400, 'message': commonMsgs.TRY_AGAIN}; 
    }
}

const getEmailUsers = ({ db }) => async ({service_type_id}) => {
    let res = await db.sequelize.query(`SELECT mailuser_id, service_type_id, smtp_username, smtp_password, sender_name, sender_emailid, status, 'false' as iseditable from sc_mailusers where service_type_id=? and deletedon is null`,
        //----- For Fetch Single Record or handle json response
        { 
            replacements: [service_type_id]
        }
    );
    return {'statusCode':200, 'data':res[0], 'message': commonMsgs.FETCH};
}

const systemconfigUserStatusUpdate = ({ db }) => async ({body,userid}) => {
    let status = body.status == 'Active' ? 'Inactive' : 'Active';
    const updateQuery = `
        UPDATE sc_mailusers
        SET modifiedon = CURRENT_TIMESTAMP, status = ?, modifiedby = ? WHERE mailuser_id = ?
    `;
    const queryParams = [status, userid, body.mailuser_id];
    try {
        await db.sequelize.query(updateQuery, {
            replacements: queryParams,
            type: db.sequelize.QueryTypes.UPDATE,
        });
        return {'statusCode':200, 'message': commonMsgs.STATUS};
    } catch (error) {
        console.error('Error systemconfig User Status Update:', error);
        throw error;
    }
}

const systemconfigUserSubmit = ({ db }) => async ({body,service_type_id,userid}) => {
   
    if (!body.smtp_username || !body.smtp_password || !body.status) {
        return {'statusCode': 400, 'message': "Required Parameters are missing !"};
    }
    try{
        let query;
        let replacements;
        if (body.mailuser_id == 0) {
            query = `
                INSERT INTO sc_mailusers (createdon, smtp_username, smtp_password, sender_name, sender_emailid, status, createdby, service_type_id)
                VALUES (CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)
            `;
            replacements = [body.smtp_username, body.smtp_password, body.sender_name, body.sender_emailid, body.status, userid, service_type_id];

            let checkexists = await db.sequelize.query(`SELECT * from sc_mailusers where service_type_id=? and deletedon is null and smtp_username=?`, 
                { 
                    replacements: [service_type_id,body.smtp_username],
                    type: db.sequelize.QueryTypes.SELECT
                }
            );
            if(checkexists.length > 0)
            {
                return {'statusCode': 400, 'message': 'SMTP User must be unique !'};
            }
            await db.sequelize.query(query, {
                replacements
            });
            return {'statusCode': 200, 'message': commonMsgs.CREATE};

        } else {
            query = `
                UPDATE sc_mailusers
                SET modifiedon = CURRENT_TIMESTAMP,
                smtp_username = ?,
                smtp_password = ?,
                sender_name = ?,
                sender_emailid = ?,
                status = ?,
                modifiedby = ?
                WHERE mailuser_id = ?
            `;
            replacements = [body.smtp_username, body.smtp_password, body.sender_name, body.sender_emailid, body.status, userid, body.mailuser_id];
            let checkexists = await db.sequelize.query(`SELECT * from sc_mailusers where service_type_id=? and deletedon is null and smtp_username=? and mailuser_id!=?`, 
                { 
                    replacements: [service_type_id,body.smtp_username, body.mailuser_id],
                    type: db.sequelize.QueryTypes.SELECT
                }
            );
            if(checkexists.length > 0)
            {
                return {'statusCode': 400, 'message': 'SMTP User must be unique !'};
            }
            await db.sequelize.query(query, {
                replacements
            });
            return {'statusCode': 200, 'message': commonMsgs.UPDATE};
        }
    } catch (error) {
        console.error('Error inserting or updating records - systemconfigUserSubmit :', error);
        return {'statusCode': 400, 'message': 'Error processing request'};
    }
} 

const systemconfigStatusUpdate = ({ db }) => async ({body,userid}) => {
    let status = body.status == 'Active' ? 'Inactive' : 'Active';
    const updateQuery = `
        UPDATE sc_servicetypes
        SET modifiedon = CURRENT_TIMESTAMP, status = ?, modifiedby = ? WHERE service_type_id = ?
    `;
    const queryParams = [status, userid, body.service_type_id];
    try {
        await db.sequelize.query(updateQuery, {
            replacements: queryParams,
            type: db.sequelize.QueryTypes.UPDATE,
        });
        return {'statusCode':200, 'message': commonMsgs.STATUS};
    } catch (error) {
        console.error('Error systemconfig Status Update:', error);
        throw error;
    }
}

// Test Email Functionality Start
const systemconfigTestEmail = ({ db }) => async ({body}) => {
    try {
        const [servicetypes] = await db.sequelize.query(`select service,service_icon from sc_servicetypes where service_type_id=${body.service_type_id}`, { type: db.sequelize.QueryTypes.SELECT });

        const [configuration] = await db.sequelize.query(`select config_values from sc_configurations where service_type_id=${body.service_type_id}`,{ type: db.sequelize.QueryTypes.SELECT });

        if(servicetypes && configuration){ 
            let config = JSON.parse(configuration.config_values); 
            const [mail_user] = await db.sequelize.query(`select * from sc_mailusers where mailuser_id=${body.mailuser_id}`, { type: db.sequelize.QueryTypes.SELECT });

            if(mail_user){ 
                const emailConfig = {
                    host: config.smtp_host,
                    port: config.smtp_port,
                    secure: false,
                    auth: {
                        user: mail_user.smtp_username,
                        pass: mail_user.smtp_password
                    }, 
                    tls: {
                        rejectUnauthorized: false
                    }
                };

                const mailOptions = {
                    from:  mail_user.sender_name ? `${mail_user.sender_name} <${mail_user.sender_emailid}>` : mail_user.sender_emailid,
                    to: `${body.email_id}`,
                    subject: `Testing Configuration Email - ${servicetypes.service}`,
                    text: `This is a test email to test configuration of ${servicetypes.service} service.`,
                    html: `<!DOCTYPE html><html><head><title>Test Email</title><style>body{margin:0;padding:0;background-color:#fff}.header{background-color:#00c7b2;color:#fff;padding:20px;text-align:center}.footer{background-color:#00c7b2;color:#fff;padding:20px;text-align:center}.content{padding:20px}</style></head><body><div class="header"><h3><strong>Tesing of ${servicetypes.service} service</strong></h3></div><div class="content"><p>This is a test email to test configuration of <strong>${servicetypes.service} service</strong> and email clients.</p><p>Please check if this email is displayed correctly in your inbox.</p></div></body></html>`,
                  };
                // Send Email
                let res = await sendEmail(emailConfig,mailOptions).then(async res => {
                    console.log("MAIL SENT",res);
                    return {'statusCode':200, 'message': commonMsgs.MAIL_SUCCESS};
                }).catch(async e => {
                    console.log("Error in MAIL SEND",e);
                    return {'statusCode':400, 'message': e.response};
                });
               return res;
            }else{ return {'statusCode':400, 'message': commonMsgs.TRY_AGAIN}; }
        }else{ return {'statusCode':400, 'message': commonMsgs.TRY_AGAIN}; }

    } catch (error) {
        console.error('Error systemconfig Test Email:', error);
        throw error;
    } 
}

const sendEmail = (emailConfig,mailOptions)=>{
    const transporter = nodeMailer.createTransport(emailConfig);
    return transporter.sendMail(mailOptions);
}
// Test Email Functionality End


module.exports = {
    systemconfigTypes,
    systemconfigSubmit,
    systemconfigStatusUpdate,
    systemconfigUserSubmit,
    getEmailUsers,
    systemconfigUserStatusUpdate,
    systemconfigDefaultUpdate,
    systemconfigTestEmail
}