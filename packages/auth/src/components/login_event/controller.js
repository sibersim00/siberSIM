const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../../middleware/authJwt_learner");
 


const checklogin = ({ dao, db, keys, crypto, validation }) => async (req, res, next) => {
  try {
    const { loginid, password, eventid } = req.body;

    let user = await dao.checklogin({ db, keys, validation })({
      loginid,
      password,
      eventid, // Pass eventid here
    });

    if (user.statusCode === 200) {
      return res.status(200).send({
        statusCode: 200,
        data: crypto.cryptoEncrypt(user),
        message: 'OTP has been sent successfully',
      });
    } else {
      return res.status(400).send({ statusCode: 400, message: user.message });
    }
  } catch (err) {
    console.log('checklogin err==>>', err);
    next(err);
  }
};


const verifylogin = ({ dao, db, keys, crypto }) => async (req, res, next) => {
  try {
    const { loginid, password, otp, eventid } = req.body;
    let user = await dao.verifylogin({ db, keys })({ loginid: loginid, password: password, otp: otp, eventid });
    if (user.statusCode == 200) {
      let jwtObj = user.learner; jwtObj.type = 'Learner';
      // const accessToken = jwt.sign(jwtObj, keys.JWT_SECURITY_KEY);
      const accessToken = await generateAccessToken(jwtObj);
      let menus = [{ menutitle: "DASHBOARD", Items: await dao.learnermenu({ db })({ learner_id: user.learner.learner_id }) }];
      return res.send({ statusCode: 200, message: 'Login successfully', data: crypto.cryptoEncrypt({ accessToken: accessToken, user: user.learner, menus: menus }) });
    }
    else {
      return res.status(400).send({ statusCode: 400, message: 'Invalid Credentials' });
    }
  }
  catch (err) { console.log('verifylogin err==>>', err); next(err) }
}



const verifyDirectLogin = ({ dao, db, keys, crypto}) => async (req, res, next) => {
  try {
    const { loginid, password, eventid } = req.body;

    // Call DAO for validation
    const user = await dao.verifyDirectLogin({ db, keys })({ loginid, password, eventid });

    if (user.statusCode === 200) {
      // Generate JWT token
      const jwtPayload = { ...user.learner, type: 'Learner' };
      // const accessToken = jwt.sign(jwtPayload, keys.JWT_SECURITY_KEY);
      const accessToken = await generateAccessToken(jwtPayload);

      // Fetch learner menu
      const menus = [{
        menutitle: "DASHBOARD",
        Items: await dao.learnermenu({ db })({ learner_id: user.learner.learner_id })
      }];

      // Prepare final encrypted payload
      const payload = crypto.cryptoEncrypt({
        accessToken,
        user: user.learner,
        menus
      });

      // Return success response
      return res.status(200).send({
        statusCode: 200,
        message: user.message || "Login successful",
        data: payload
      });
    } else {
      // Return failure response with DAO message
      return res.status(400).send({
        statusCode: user.statusCode || 400,
        message: user.message || "Login failed"
      });
    }
  } catch (err) {
    console.error("verifyDirectLogin error:", err);
    return next(err);
  }
};


const checkforgot = ({ dao, db, keys, crypto }) => async (req, res, next) => {
  try {
    const { loginid } = req.body;
    let user = await dao.checkforgot({ db, keys })({ loginid: loginid });
    if (user) {
      return res.status(200).send({ statusCode: 200, data: crypto.cryptoEncrypt(user), message: 'OTP has been sent successfully' });
    } else {
      return res.status(400).send({ statusCode: 400, message: 'No details were found for the provided credentials. Please verify and try again.' });
    }
  }
  catch (err) { console.log('checkforgot err==>>', err); next(err) }
}

const verifyforgot = ({ dao, db, keys, crypto }) => async (req, res, next) => {
  try {
    const { loginid, password, otp } = req.body;
    let user = await dao.verifyforgot({ db, keys })({ loginid: loginid, password: password, otp: otp });
    if (user) {
      return res.send({ statusCode: 200, message: 'New password updated successfully', data: crypto.cryptoEncrypt({ user: user }) });
    } else {
      return res.status(400).send({ statusCode: 400, message: 'Invalid credentials. Please verify and try again.' });
    }
  }
  catch (err) { console.log('verifyforgot err==>>', err); next(err) }
}

const geteventlist = ({ dao, db }) => async (req, res, next) => {
  try {
    const result = await dao.geteventlist({ db })();

    if (result.statusCode === 200) {
      return res.status(200).send({
        statusCode: 200,
        message: "Event list fetched successfully",
        data: result.data,
      });
    } else {
      return res.status(400).send({
        statusCode: result.statusCode,
        message: result.message,
      });
    }
  } catch (err) {
    console.error("Controller Error in geteventlist:", err);
    next(err);
  }
};

module.exports = {
  checklogin,
  verifylogin,
  verifyDirectLogin,
  geteventlist
}
