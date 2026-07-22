// @ts-ignore - VS Code TS Server cache issue, the client is generated correctly
import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global `var` declarations to avoid duplicate clients in dev (hot reload)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
