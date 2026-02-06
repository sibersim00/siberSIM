const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const constants = require("../../services/proxmox/constants");

const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");



const generateProxmoxAccessToken = ({ db, payload }) => async (ip_address) => {
    const proxmox = ProxMoxService(db, payload, ip_address);
    const result = await proxmox.generateAccessTicket();
    const ticket = result?.data?.ticket;
    if (!ticket || result.status !== "200") {
      await new NotiTemplate(db, "proxmox_down", { learner_id: 0, userid: 0 }, "System", 0, `Proxmox Service is down. Please try again later.`);
      new MailTemplate(db, "proxmox_down_alert", {
          downdatetime: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });
    }
    return {statusCode: result.status === "200" ? 200 : 500, message: result.message,data: ticket ? {ticket, cookie: constants.cookie_prefix + ticket} : null};
  };


module.exports = {
  generateProxmoxAccessToken,
};
