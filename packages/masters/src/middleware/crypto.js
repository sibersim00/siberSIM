const CryptoJS = require('crypto-js');
const keys = require('./../keys');
const keyString = keys.CRYPTO_SECURITY_KEY;

const cryptoEncrypt = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, keys.CRYPTO_SECURITY_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Encryption failed');
  }
};
const cryptoDecrypt = () => {
  return (req, res, next) => {
    try {
      if (!req.body.payload) {
        return next(); // No payload present
      }
      const bytes = CryptoJS.AES.decrypt(req.body.payload, keys.CRYPTO_SECURITY_KEY);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedText) throw new Error('Failed to decrypt payload');
      req.body = JSON.parse(decryptedText);
      next();
    } catch (error) {
      console.error('Decryption error:', error.message);
      res.status(400).json({ error: 'Invalid payload' });
    }
  };
};

module.exports = {
  cryptoEncrypt,
  cryptoDecrypt
};


