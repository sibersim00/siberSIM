const { generateAccessToken } = require("../../middleware/authJwt");
const organizationList =
  ({ dao, db }) =>
  async (req, res, next) => {
    let id = req.params.id ? req.params.id : null;
    await dao
      .organizationList({ db })(id)
      .then((result) => {
        return res
          .status(200)
          .send({
            statusCode: 200,
            data: result,
            message: "Fetech successfully",
          });
      })
      .catch((err) => {
        return res.status(500).send({ statusCode: 500, message: err.message });
      });
  };

const getCompanySettingController =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const settings = await dao.getCompanyWebSetting({ db })();

      if (!settings) {
        return res
          .status(404)
          .send({
            statusCode: 404,
            message: "Settings not found for the given company.",
          });
      }

      return res
        .status(200)
        .send({
          statusCode: 200,
          data: settings,
          message: "Company settings fetched successfully",
        });
    } catch (err) {
      console.error("getCompanySettingController err==>>", err);
      next(err);
    }
  };
const checklogin =
  ({ dao, db, keys, crypto, validation }) =>
  async (req, res, next) => {
    try {
      const { loginid, password, orgid } = req.body;
      let user = await dao.checklogin({ db, keys, validation })({
        loginid: loginid,
        password: password,
        orgid: orgid,
      });
      if (user.statusCode == 200) {
        return res
          .status(200)
          .send({
            statusCode: 200,
            data: crypto.cryptoEncrypt(user),
            message: "OTP has been sent successfully",
          });
      } else {
        return res.status(400).send({ statusCode: 400, message: user.message });
      }
    } catch (err) {
      console.log("checklogin err==>>", err);
      next(err);
    }
  };
const verifylogin =
  ({ dao, db, keys, crypto }) =>
  async (req, res, next) => {
    try {
      const { loginid, password, orgid, otp } = req.body;
      let user = await dao.verifylogin({ db, keys })({
        loginid,
        password,
        orgid,
        otp,
      });

      if (user.statusCode == 200) {
        const hostname = req?.hostname;
        console.log("req=========>",hostname);
        const accessToken = await generateAccessToken(hostname,user.user); // Now in controller
        let menus = [
          {
            menutitle: "DASHBOARD",
            Items: await dao.userrolemenu({ db })({ userid: user.user.userid }),
          },
        ];
        return res.send({
          statusCode: 200,
          message: "Login successfully",
          data: crypto.cryptoEncrypt({ accessToken, user: user.user, menus }),
        });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: "Invalid Credentials" });
      }
    } catch (err) {
      console.log("verifylogin err==>>", err);
      next(err);
    }
  };
const verifyDirectLogin =
  ({ dao, db, keys, crypto ,validation }) =>
  async (req, res, next) => {
    try {
      const { loginid, password, orgid } = req.body;
      let user = await dao.verifyDirectLogin({ db, keys,validation })({
        loginid,
        password,
        orgid,
      });

      if (user.statusCode == 200) {
        const hostname = req?.hostname;
        console.log("req=========>",hostname);
        const accessToken = await generateAccessToken(hostname,user.user); // Now in controller
        let menus = [
          {
            menutitle: "DASHBOARD",
            Items: await dao.userrolemenu({ db })({ userid: user.user.userid }),
          },
        ];
        return res.send({
          statusCode: 200,
          message: "Login successfully",
          data: crypto.cryptoEncrypt({ accessToken, user: user.user, menus }),
        });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: user.message || "Invalid Credentials" });
      }
    } catch (err) {
      console.log("verifyDirectLogin err==>>", err);
      next(err);
    }
  };

const generateRewrites =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      let result = await dao.generateRewrites({ db })();
      return res.status(200).send(result);
    } catch (err) {
      console.log("verifylogin err==>>", err);
      next(err);
    }
  };
const checkforgot =
  ({ dao, db, keys, crypto }) =>
  async (req, res, next) => {
    try {
      const { loginid, orgid } = req.body;
      let user = await dao.checkforgot({ db, keys })({
        loginid: loginid,
        orgid: orgid,
      });
      if (user) {
        return res
          .status(200)
          .send({
            statusCode: 200,
            data: crypto.cryptoEncrypt(user),
            message: "OTP has been sent successfully",
          });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: "Invalid Credentials" });
      }
    } catch (err) {
      console.log("checkforgot err==>>", err);
      next(err);
    }
  };
const verifyforgot =
  ({ dao, db, keys, crypto }) =>
  async (req, res, next) => {
    try {
      const { loginid, password, orgid, otp } = req.body;
      let user = await dao.verifyforgot({ db, keys })({
        loginid: loginid,
        password: password,
        orgid: orgid,
        otp: otp,
      });
      if (user) {
        return res.send({
          statusCode: 200,
          message: "New password updated successfully",
          data: crypto.cryptoEncrypt({ user: user }),
        });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: "Invalid Credentials" });
      }
    } catch (err) {
      console.log("verifyforgot err==>>", err);
      next(err);
    }
  };
const register =
  ({ dao, db, validation, keys }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const result = await dao.register({ db, validation, keys })(body);
      return res
        .status(result.statusCode)
        .send({
          statusCode: result.statusCode,
          message: result.message,
          errors: result.errors,
        });
    } catch (error) {
      console.error("Error on save data:", error.message);
      return res
        .status(500)
        .json({
          statusCode: 500,
          error: "An error occurred. Please try again later.",
        });
    }
  };

const verifyById =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const instructor_id = req.body.instructor_id;
      const result = await dao.verifyById({ db, validation })(instructor_id);
      res
        .status(200)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Error Deleting data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };
const verifySuccessById =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const instructor_useruuid = req.body.instructor_useruuid;
      const result = await dao.verifySuccessById({ db, validation })(
        instructor_useruuid
      );
      res
        .status(200)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Error Deleting data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

module.exports = {
  organizationList,
  getCompanySettingController,
  checklogin,
  verifylogin,
  verifyDirectLogin,
  generateRewrites,
  checkforgot,
  verifyforgot,
  verifyById,
  verifySuccessById,
  register,
};
