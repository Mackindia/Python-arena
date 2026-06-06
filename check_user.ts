import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/python_arena";

async function check() {
  // Try to load env
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config();
  
  const uri = process.env.MONGODB_URI || "mongodb+srv://doonscholars:doonscholars@cluster0.mongodb.net/doonscholars";
  
  await mongoose.connect(uri);
  const User = mongoose.connection.collection("users");
  
  const byUsername = await User.findOne({ username: "s1197" });
  const byEmail = await User.findOne({ email: { $regex: /s1197/i } });
  const byTeacherId = await User.findOne({ teacher_id: "s1197" });
  const byId = await User.findOne({ id: "s1197" });

  console.log("By Username:", byUsername);
  console.log("By Email:", byEmail);
  console.log("By Teacher ID:", byTeacherId);
  console.log("By ID field:", byId);

  process.exit(0);
}

check();
