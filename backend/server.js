// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config(); // Must be at the very top

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- MongoDB Connection ---
const mongoURL = process.env.MONGO_URL;

if (!mongoURL) {
  console.error("Error: MONGO_URL is not defined in .env");
  process.exit(1);
}

mongoose
  .connect(mongoURL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Schema ---
const complaintSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: Object,
  concerned_department: String,
  images: [String],
  audio_note: String,
  approved: { type: Boolean, default: false },
  status: { type: String, default: "Pending" },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  date_of_publishing: String,
});

const Complaint = mongoose.model("Complaint", complaintSchema);

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// --- Routes ---
app.get("/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/complaints", upload.array("images"), async (req, res) => {
  try {
    const data = req.body;
    const images = req.files.map(
      (f) => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`
    );

    const complaint = new Complaint({
      ...data,
      images,
      audio_note: data.audio_note || null,
    });

    await complaint.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

