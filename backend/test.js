import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("MONGO_URL:", process.env.MONGO_URL); // check if loaded

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
