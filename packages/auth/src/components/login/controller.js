const { generateAccessToken } = require("./../../middleware/authJwt");
const organizationList =
  ({ dao, db }) =>
  async (req, res, next) => {
    let id = req.params.id ? req.params.id : null;
    await dao
      .organizationList({ db })(id)
      .then((result) => {
        return res.status(200).send({
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
      const hostname = req?.hostname;
      console.log("req=========>", hostname);
      const settings = await dao.getCompanyWebSetting({ db })(hostname);
      if (settings.status) {
        return res.status(200).send({
          statusCode: 200,
          data: settings.data,
          message: "Company settings fetched successfully",
          redirect: settings.redirect,
        });
      } else {
        return res.status(404).send({
          statusCode: 404,
          data: settings.data,
          message: "Settings not found for the given company.",
        });
      }
    } catch (err) {
      console.error("getCompanySettingController err==>>", err);
      next(err);
    }
  };
const checklogin =
  ({ dao, db, keys, crypto }) =>
  async (req, res, next) => {
    try {
      const { loginid, password, orgid } = req.body;
      let user = await dao.checklogin({ db, keys })({
        loginid: loginid,
        password: password,
        orgid: orgid,
      });
      if (user.statusCode == 200) {
        return res.status(200).send({
          statusCode: 200,
          data: crypto.cryptoEncrypt(user),
          message: "OTP sent successfully.",
        });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: "Invalid Credentials" });
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
      const user = await dao.verifylogin({ db, keys })({
        loginid,
        password,
        orgid,
        otp,
      });

      if (user.statusCode === 200) {
        const hostname = req?.hostname;
        let menuItem = await dao.userrolemenu({ db })({
          userid: user.user.userid,
        });
        const menus = [{ menutitle: "DASHBOARD", Items: menuItem }];
        if (
          !menus ||
          !Array.isArray(menus) ||
          menus.length === 0 ||
          !menus.some(
            (menu) =>
              Array.isArray(menu.Items) &&
              menu.Items.some(
                (item) =>
                  item?.menuid &&
                  item.menuid !== 0 &&
                  (item.source ||
                    (Array.isArray(item.children) &&
                      item.children.some(
                        (child) =>
                          child?.menuid && child.menuid !== 0 && child.source
                      )))
              )
          )
        ) {
          return res.status(403).send({
            statusCode: 403,
            message:
              "You do not have permission to access the system. Please contact your administrator.",
          });
        }

        let userObj = user.user;
        const extractSources = (items) =>
          items.flatMap((i) => [
            i.source,
            ...(i.children ? extractSources(i.children) : []),
          ]);
        userObj.menus = extractSources(menuItem);
        const access_token = await generateAccessToken(hostname, userObj);

        return res.send({
          statusCode: 200,
          message: "Login successfully",
          data: crypto.cryptoEncrypt({
            accessToken: access_token,
            user: user.user,
            menus,
          }),
        });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: "Invalid OTP" });
      }
    } catch (err) {
      console.log("verifylogin err==>>", err);
      next(err);
    }
  };

const verifyDirectLogin =
  ({ dao, db, keys, crypto }) =>
  async (req, res, next) => {
    try {
      const { loginid, password, orgid } = req.body;
      const user = await dao.verifyDirectLogin({ db, keys })({
        loginid,
        password,
        orgid,
      });

      if (user.statusCode === 200) {
        const hostname = req?.hostname;
        let menuItem = await dao.userrolemenu({ db })({
          userid: user.user.userid,
        });
        const menus = [{ menutitle: "DASHBOARD", Items: menuItem }];
        if (
          !menus ||
          !Array.isArray(menus) ||
          menus.length === 0 ||
          !menus.some(
            (menu) =>
              Array.isArray(menu.Items) &&
              menu.Items.some(
                (item) =>
                  item?.menuid &&
                  item.menuid !== 0 &&
                  (item.source ||
                    (Array.isArray(item.children) &&
                      item.children.some(
                        (child) =>
                          child?.menuid && child.menuid !== 0 && child.source
                      )))
              )
          )
        ) {
          return res.status(403).send({
            statusCode: 403,
            message:
              "You do not have permission to access the system. Please contact your administrator.",
          });
        }

        let userObj = user.user;
        // userObj.menus = menuItem.map((obj)=> obj.source);
        const extractSources = (items) =>
          items.flatMap((i) => [
            i.source,
            ...(i.children ? extractSources(i.children) : []),
          ]);
        userObj.menus = extractSources(menuItem);
        const access_token = await generateAccessToken(hostname, userObj); // << updated

        return res.send({
          statusCode: 200,
          message: "Login successfully",
          data: crypto.cryptoEncrypt({
            accessToken: access_token,
            user: user.user,
            menus,
          }),
        });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: "Invalid Credentials" });
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
        return res.status(200).send({
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

module.exports = {
  organizationList,
  getCompanySettingController,
  checklogin,
  verifylogin,
  verifyDirectLogin,
  generateRewrites,
  checkforgot,
  verifyforgot,
};
