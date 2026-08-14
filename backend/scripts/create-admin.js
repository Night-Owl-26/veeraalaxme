// One-off utility: creates (or promotes) an ADMIN user directly via Prisma,
// bypassing the public registration API — which intentionally blocks
// self-assigning the ADMIN role, so this is the only way to get one.
//
// Run against whichever database DATABASE_URL points at. For production,
// grab the "External Database URL" from Render → your Postgres → Connect,
// and run this from your own machine (don't paste that URL anywhere else):
//
//   DATABASE_URL="<external-connection-string>" node scripts/create-admin.js "Your Name" "+919876500000" "you@example.com" "a-strong-password"
//
// Safe to re-run: if the phone number already has an account, it's promoted
// to ADMIN and its password/email updated rather than erroring.
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const [name, phone, email, password] = process.argv.slice(2);
  if (!name || !phone || !email || !password) {
    console.error("Usage: node scripts/create-admin.js <name> <phone> <email> <password>");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { phone },
    update: { role: "ADMIN", passwordHash, name, email, emailVerified: true, phoneVerified: true },
    create: { name, phone, email, passwordHash, role: "ADMIN", emailVerified: true, phoneVerified: true },
  });
  console.log("Admin ready:", { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
