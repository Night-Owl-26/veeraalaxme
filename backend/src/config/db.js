const { PrismaClient } = require("@prisma/client");

// Single shared Prisma client. Prisma parameterizes every query it builds,
// which is what protects every read/write in this codebase from SQL injection —
// as long as no route drops down to $queryRawUnsafe with interpolated strings.
// (Search the codebase for "queryRaw" during review; there should be none.)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

module.exports = prisma;
