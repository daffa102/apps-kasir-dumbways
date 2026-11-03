import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route"; 

dotenv.config();

const app = express()
const PORT = process.env.PORT || 5001;

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.get("/", (req, res) => {
  res.json({ message: "Server Kopora POS is running!" });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
