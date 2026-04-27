const mongoose = require("mongoose");
const { MONGO_URI } = require("./config");

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ Error connecting: ", err));
