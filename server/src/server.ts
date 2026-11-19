import express from "express";
import cors from "cors";
import  "dotenv/config";
import authRoutes from "./routes/auth.route"; 
import categoryRoutes from "./routes/category.route"
import menuRoutes from "./routes/menu.route";
import orderRoutes from "./routes/order.route"
import midtransRoutes from "./routes/midtrans.route"
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken"
import path from "path";
import { getJwtSecret } from "./config/jwt";


const app = express()
const PORT = process.env.PORT || 5001;
const JWT_SECRET = getJwtSecret();

if (Buffer.byteLength(JWT_SECRET, "utf8") < 32) {
  console.warn("Peringatan: JWT_SECRET sebaiknya minimal 32 byte.");
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.set("io", io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (typeof token !== "string") {
    return next(new Error("Token belum tersedia"));
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (typeof user === "string" || user.role !== "BARISTA") {
      return next(new Error("Akses hanya untuk BARISTA"));
    }
    socket.join("kds:baristas");
    next();
  } catch {
    next(new Error("Token tidak valid"));
  }
});


io.on("connection", (socket) => {
  console.log("Client terhubung:", socket.id);
});


app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes)
app.use("/api/webhooks/midtrans", midtransRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Server Kopora POS is running!" });
});
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

httpServer.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
