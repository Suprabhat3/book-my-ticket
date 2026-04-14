import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

const server = app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
