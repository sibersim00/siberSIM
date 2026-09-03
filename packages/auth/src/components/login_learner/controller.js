const { generateAccessToken } = require("../../middleware/authJwt_learner");

const checklogin =
  ({ dao, db, keys, crypto, validation }) =>
  async (req, res, next) => {
    try {
      const { loginid, password } = req.body;

      const user = await dao.checklogin({ db, keys, validation })({
        loginid,
        password,
      });

      if (user.statusCode === 200) {
        return res.status(200).send({
          statusCode: 200,
          data: crypto.cryptoEncrypt(user),
          message: "OTP has been sent successfully",
        });
      } else {
        return res.status(400).send({ statusCode: 400, message: user.message });
      }
    } catch (err) {
      console.error("checklogin err ==>>", err);
      next(err);
    }
  };

const verifylogin =
  ({ dao, db, keys, crypto }) =>
  async (req, res, next) => {
    try {
      const { loginid, password, otp } = req.body;

      const user = await dao.verifylogin({ db, keys })({
        loginid,
        password,
        otp,
      });

      if (user.statusCode === 200) {
        const learner = user.learner;
        const hostname = req?.hostname;
        const menus = [
          {
            menutitle: "DASHBOARD",
            Items: await dao.learnermenu({ db })({
              learner_id: learner.learner_id,
            }),
          },
        ];
        const extractSources = (items) => items.flatMap(i => [i.source,...(i.children ? extractSources(i.children) : [])]);
        let userObj = user.learner;
        userObj.menus = extractSources(menus[0]?.Items);
        const accessToken = await generateAccessToken(hostname,userObj);

        return res.send({
          statusCode: 200,
          message: "Login successfully",
          data: crypto.cryptoEncrypt({accessToken: accessToken, user: user.learner, menus: menus}),
        });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: "Invalid Credentials" });
      }
    } catch (err) {
      console.error("verifylogin err ==>>", err);
      next(err);
    }
  };

const verifyDirectLogin =
  ({ dao, db, keys, crypto ,validation }) =>
  async (req, res, next) => {
    try {
      const { loginid, password } = req.body;

      const user = await dao.verifyDirectLogin({ db, keys,validation })({
        loginid,
        password,
      });

      if (user.statusCode === 200) {
        const learner = user.learner;
        const hostname = req?.hostname;
        
        const menus = [
          {
            menutitle: "DASHBOARD",
            Items: await dao.learnermenu({ db })({
              learner_id: learner.learner_id,
            }),
          },
        ];
        const extractSources = (items) => items.flatMap(i => [i.source,...(i.children ? extractSources(i.children) : [])]);
        let userObj = user.learner;
        userObj.menus = extractSources(menus[0]?.Items);
        const accessToken = await generateAccessToken(hostname,userObj);

        return res.send({
          statusCode: 200,
          message: "Login successfully",
          data: crypto.cryptoEncrypt({accessToken: accessToken, user: user.learner, menus: menus}),
        });
      } else {
        return res
          .status(400)
          .send({ statusCode: 400, message: user.message || "Invalid Credentials" });
      }
    } catch (err) {
      console.error("verifyDirectLogin err ==>>", err);
      next(err);
    }
  };

const checkforgot =
  ({ dao, db, keys, crypto }) =>
  async (req, res, next) => {
    try {
      const { loginid } = req.body;

      const user = await dao.checkforgot({ db, keys })({ loginid });

      if (user) {
        return res.status(200).send({
          statusCode: 200,
          data: crypto.cryptoEncrypt(user),
          message: "OTP has been sent successfully",
        });
      } else {
        return res.status(400).send({
          statusCode: 400,
          message:
            "No details were found for the provided credentials. Please verify and try again.",
        });
      }
    } catch (err) {
      console.error("checkforgot err ==>>", err);
      next(err);
    }
  };

const verifyforgot =
  ({ dao, db, keys, crypto }) =>
  async (req, res, next) => {
    try {
      const { loginid, password, otp } = req.body;

      const user = await dao.verifyforgot({ db, keys })({
        loginid,
        password,
        otp,
      });

      if (user) {
        return res.send({
          statusCode: 200,
          message: "New password updated successfully",
          data: crypto.cryptoEncrypt({ user }),
        });
      } else {
        return res.status(400).send({
          statusCode: 400,
          message: "Invalid credentials. Please verify and try again.",
        });
      }
    } catch (err) {
      console.error("verifyforgot err ==>>", err);
      next(err);
    }
  };

const { checkLearnerCapacity } = require("../../utils/learnerLicenseLimit");

const register =
  ({ dao, db, validation, keys }) =>
  async (req, res) => {
    try {
      const body = req.body;

      const capacity = await checkLearnerCapacity({
        db,
        hostname: req.hostname,
      });
      if (!capacity.allowed) {
        const message = capacity.invalidLicense
          ? "The installed license could not be validated."
          : `You've reached your learner limit. To continue, either remove a learner or reach out to support for assistance.`;
        return res.status(400).send({ statusCode: 400, message, errors: [] });
      }

      const result = await dao.register({ db, validation, keys })(body);

      return res.status(result.statusCode).send({
        statusCode: result.statusCode,
        message: result.message,
        errors: result.errors,
      });
    } catch (error) {
      console.error("Error on save data:", error.message);
      return res.status(500).json({
        statusCode: 500,
        error: "An error occurred. Please try again later.",
      });
    }
  };

const verifySuccessById =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const { learner_uuid } = req.body;

      const result = await dao.verifySuccessById({ db, validation })(
        learner_uuid
      );

      res.status(200).send({
        statusCode: result.statusCode,
        message: result.message,
      });
    } catch (error) {
      console.error("Error Deleting data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

module.exports = {
  checklogin,
  verifylogin,
  verifyDirectLogin,
  checkforgot,
  verifyforgot,
  register,
  verifySuccessById,
};
