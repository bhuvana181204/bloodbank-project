//backend/utils/compatibility.js
const compatibilityMap = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["ALL"], // Universal receiver
};

function getCompatibleDonors(group) {
  if (group === "AB+") return null; // Means any group allowed
  return compatibilityMap[group];
}

module.exports = { getCompatibleDonors };
