const createError = ({e}) => err => {
    if (Object.keys(e).some(eKey => err.message.indexOf(e[eKey]) > -1)) {
      const eOriginalMessage = err.message;
  
      const parts = eOriginalMessage.split('@>');
  
      const error = parts[0];
      let response = {};
  
      if (parts.length > 1) {
        const jsonStr = parts[1].trim();
        response = JSON.parse(jsonStr);
      }
  
      return {
        error,
        response
      };
    }
  
    return err;
  };
  
  module.exports = createError;
  