import "dotenv/config";
import { defineConfig, env } from "prisma/config";

type PrismaEnv = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations run best over a direct (unpooled) connection. Falls back to
    // DATABASE_URL when the provider does not hand out a separate direct URL.
    url: process.env["DIRECT_URL"] ?? env<PrismaEnv>("DATABASE_URL"),
  },
});
