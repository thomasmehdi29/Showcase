import { initializeDatabase } from "../src/initDb.js";

try {
  const result = await initializeDatabase();
  console.log(`Database ready. ${result.message}`);
} catch (error) {
  console.error("Failed to initialize database:", error);
  process.exitCode = 1;
}
