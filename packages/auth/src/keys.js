module.exports = {
    AUTH_PORT:process.env.AUTH_PORT || 4002,
    MYSQL_HOST: process.env.MYSQL_HOST || '192.168.0.19',
    MYSQL_USER: process.env.MYSQL_USER || 'root' ,
    MYSQL_DB: process.env.MYSQL_DB || 'battle_rangers_new',
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '1100',
    MYSQL_PORT: process.env.MYSQL_PORT || 3306,
    JWT_SECURITY_KEY:process.env.JWT_SECURITY_KEY || 'c4a7ae125ee66539kmadomwe9hw7ys8jcc8s766c3202mcwcn1fbbd68ff60bf',
    CRYPTO_SECURITY_KEY:process.env.CRYPTO_SECURITY_KEY || 'jds9327nmf48cm48cmvbvtqpz984510nmcvrwi206cn',
     JWT_REFRESH_SECRET:process.env.JWT_REFRESH_SECRET || 'c4a7ae125ee66539kmadomwe9hw7ys8jcc8s766c3202mcwcn1fbbd68ff60bf',
    JWT_REFRESH_EXPIRES_IN:process.env.JWT_REFRESH_EXPIRES_IN || '55m',
    JWT_EXPIRES_IN:process.env.JWT_EXPIRES_IN || '2m',
    OTP_TIMEOUT:process.env.OTP_TIMEOUT || 10,
    ADMIN_ROLE_ID:process.env.ADMIN_ROLE_ID || 1,
    INSTRUCTOR_ROLE_ID:process.env.INSTRUCTOR_ROLE_ID || 2,
    ADMIN_USER_ID:process.env.ADMIN_USER_ID || 2,
    SUPER_ROLE_ID:process.env.SUPER_ROLE_ID,
    WEB_ORIGIN:process.env.WEB_ORIGIN 
  };


  