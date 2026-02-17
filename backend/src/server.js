import express from "express";
import cors from "cors";
import morgan from "morgan";
import vendorsRouter from "./routes/vendors.js";
import eventsRouter from "./routes/events.js";
import locationsRouter from "./routes/locations.js";
import communityPostsRouter from "./routes/communityPosts.js";
import { initializeDatabase } from "./initDb.js";

const app = express();
const PORT = Number.parseInt(process.env.PORT ?? "4000", 10);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
  res.json({ status: "ok", service: "showcase-backend" });
});

app.use("/api/vendors", vendorsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/community-posts", communityPostsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

initializeDatabase()
  .then(({ message }) => {
    console.log(`Database initialized. ${message}`);
    app.listen(PORT, () => {
      console.log(`Showcase backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
