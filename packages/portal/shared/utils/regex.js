// Regex for validating phone numbers
export const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

// Regex for validating email addresses
export const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

export const passwordmessage = "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character from: ! @ # $ % ^ &"

export const usernamemessage = "Username must be 5–30 characters long and contain only letters and numbers (alphanumeric).";

export const emojiRegex =
  /[\u{1F600}-\u{1F64F}]|[\u{2702}-\u{27B0}]|[\u{1F680}-\u{1F6FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F1E6}-\u{1F1FF}]/u;


// Get initials from name
export const getInitials = (name = "") => {
  if (!name) return "U";

  const words = name.trim().split(" ");
  if (words.length === 1) return words[0][0].toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
};

// Generate stable color based on name
export const stringToColor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "#A7C7E7","#C1E1C1","#FFD6A5","#FFADAD","#BDB2FF",
    "#9BF6FF","#CAFFBF","#FFC6FF","#FDFFB6","#D0F4DE"
  ];

  return colors[Math.abs(hash) % colors.length];
};
