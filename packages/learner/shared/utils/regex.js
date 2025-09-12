// Regex for validating phone numbers
export const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

// Regex for validating email addresses
export const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

export const passwordmessage = "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character from: ! @ # $ % ^ &"


export const usernamemessage = "Username must be 5–30 characters long and contain only letters and numbers (alphanumeric).";