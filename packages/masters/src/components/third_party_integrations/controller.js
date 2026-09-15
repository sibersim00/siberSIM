const licenseEnabled = (req) =>
  req.user?.issuper || req.user?.third_party === true;
const licenseDenied = (res) =>
  res
    .status(403)
    .send({
      statusCode: 403,
      message: "Third party integrations are not enabled by the license.",
    });

const getThirdPartyIntegrations =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      if (!licenseEnabled(req)) return licenseDenied(res);
      const result = await dao.getThirdPartyIntegrations({ db })(null);
      return res
        .status(200)
        .send({
          statusCode: 200,
          message: validation.messages.get_success,
          data: result,
        });
    } catch (error) {
      console.error("Third party integration fetch error:", error.message);
      return res
        .status(500)
        .json({ statusCode: 500, error: validation.messages.server_error });
    }
  };

const getAvailableThirdPartyIntegrations =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      if (!licenseEnabled(req)) return licenseDenied(res);
      const allowedPanels = ["SIMUser", "SIMInstructor", "SIMMaster"];
      if (!allowedPanels.includes(req.query.target_panel))
        return res
          .status(400)
          .send({
            statusCode: 400,
            message: validation.messages.invalid_target_panel,
          });
      const result = await dao.getAvailableThirdPartyIntegrations({ db })(
        req.query.target_panel,
      );
      return res
        .status(200)
        .send({
          statusCode: 200,
          message: validation.messages.get_success,
          data: result,
        });
    } catch (error) {
      console.error(
        "Available third party integration fetch error:",
        error.message,
      );
      return res
        .status(500)
        .json({ statusCode: 500, error: validation.messages.server_error });
    }
  };

const saveThirdPartyIntegration =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      if (!licenseEnabled(req)) return licenseDenied(res);
      const result = await dao.saveThirdPartyIntegration({ db, validation })(
        req.body,
        req.user.userid,
      );
      if (result.statusCode === 200)
        return res
          .status(200)
          .send({ statusCode: 200, message: validation.messages.save_success });
      return res
        .status(400)
        .send({
          statusCode: 400,
          message: result.errors || [
            validation.messages.something_wrong_try_later,
          ],
        });
    } catch (error) {
      console.error("Third party integration save error:", error.message);
      return res
        .status(500)
        .json({ statusCode: 500, error: validation.messages.server_error });
    }
  };

const updateThirdPartyIntegration =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      if (!licenseEnabled(req)) return licenseDenied(res);
      const result = await dao.updateThirdPartyIntegration({ db, validation })(
        req.body,
        req.user.userid,
      );
      if (result.statusCode === 200)
        return res
          .status(200)
          .send({
            statusCode: 200,
            message: validation.messages.update_success,
          });
      return res
        .status(400)
        .send({
          statusCode: 400,
          message: result.errors || [
            validation.messages.something_wrong_try_later,
          ],
        });
    } catch (error) {
      console.error("Third party integration update error:", error.message);
      return res
        .status(500)
        .json({ statusCode: 500, error: validation.messages.server_error });
    }
  };

const deleteThirdPartyIntegration =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      if (!licenseEnabled(req)) return licenseDenied(res);
      const result = await dao.deleteThirdPartyIntegration({ db, validation })(
        req.body.integration_id,
        req.user.userid,
      );
      if (result.statusCode === 200)
        return res
          .status(200)
          .send({
            statusCode: 200,
            message: validation.messages.delete_success,
          });
      return res
        .status(400)
        .send({
          statusCode: 400,
          message: result.errors || [
            validation.messages.something_wrong_try_later,
          ],
        });
    } catch (error) {
      console.error("Third party integration delete error:", error.message);
      return res
        .status(500)
        .json({ statusCode: 500, error: validation.messages.server_error });
    }
  };

const changeThirdPartyIntegrationStatus =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      if (!licenseEnabled(req)) return licenseDenied(res);
      const result = await dao.changeThirdPartyIntegrationStatus({
        db,
        validation,
      })({ ...req.body, userid: req.user.userid });
      return res
        .status(result.statusCode)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Third party integration status error:", error.message);
      return res
        .status(500)
        .json({ statusCode: 500, error: validation.messages.server_error });
    }
  };

module.exports = {
  getThirdPartyIntegrations,
  getAvailableThirdPartyIntegrations,
  saveThirdPartyIntegration,
  updateThirdPartyIntegration,
  deleteThirdPartyIntegration,
  changeThirdPartyIntegrationStatus,
};
