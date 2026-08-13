// Run with: npm run prisma:seed
// Creates one admin, one seller, one buyer, and a few approved listings so
// the frontend has real data to render against on first run.
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const DEV_PASSWORD = "Passw0rd!";

function encryptField(plaintext) {
  const key = Buffer.from(process.env.FIELD_ENCRYPTION_KEY || "0".repeat(64), "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { phone: "+919999900000" },
    update: {},
    create: {
      phone: "+919999900000", name: "Admin", role: "ADMIN", phoneVerified: true,
      email: "admin@veeralaxmevastu.com", emailVerified: true, passwordHash,
    },
  });

  const seller = await prisma.user.upsert({
    where: { phone: "+919876543210" },
    update: {},
    create: {
      phone: "+919876543210", name: "Karthik Subramanian", role: "SELLER", phoneVerified: true, isVerifiedSeller: true,
      email: "seller@veeralaxmevastu.com", emailVerified: true, passwordHash,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { phone: "+919000011223" },
    update: {},
    create: {
      phone: "+919000011223", name: "Divya Raman", role: "BUYER", phoneVerified: true,
      email: "buyer@veeralaxmevastu.com", emailVerified: true, passwordHash,
    },
  });

  const listings = [
    {
      title: "3BHK Villa with Private Garden", type: "Villa", price: 18500000, city: "Chennai", locality: "Injambakkam, ECR",
      areaLabel: "2400 sqft", bedrooms: 4, bathrooms: 4, facing: "E", kitchenDir: "S", entranceDir: "E", poojaRoom: true,
      water: true, electricity: true, compoundWall: true, road: "30 ft",
      description: "A sea-breeze villa two streets off ECR, with a private garden and a dedicated pooja room facing east.",
      surveyNumber: "241", ownership: "Freehold", loanAvailable: true, documentsVerified: true, vastuScore: 92,
    },
    {
      title: "DTCP Approved Residential Plot", type: "Residential Land", price: 4200000, city: "Chennai", locality: "Guduvancheri",
      areaLabel: "1800 sqft", facing: "N", kitchenDir: "S", entranceDir: "N", poojaRoom: false,
      water: true, electricity: true, compoundWall: false, road: "20 ft",
      description: "Corner plot in a DTCP-approved layout, north facing with a 20 ft approach road.",
      surveyNumber: "088", ownership: "Freehold", loanAvailable: true, documentsVerified: true, vastuScore: 88,
    },
    {
      title: "2BHK Apartment near IT Corridor", type: "Apartment", price: 7800000, city: "Chennai", locality: "Sholinganallur, OMR",
      areaLabel: "1150 sqft", bedrooms: 2, bathrooms: 2, facing: "E", kitchenDir: "N", entranceDir: "E", poojaRoom: false,
      water: true, electricity: true, compoundWall: true, road: "40 ft",
      description: "Gated community apartment on the 4th floor, five minutes' walk from the OMR IT corridor.",
      surveyNumber: "712", ownership: "Freehold", loanAvailable: true, documentsVerified: false, vastuScore: 74,
    },
  ];

  for (const l of listings) {
    const { surveyNumber, ...rest } = l;
    await prisma.property.create({
      data: { ...rest, sellerId: seller.id, status: "APPROVED", surveyNumberEnc: encryptField(surveyNumber) },
    });
  }

  console.log("Seeded:", {
    admin: admin.phone, seller: seller.phone, buyer: buyer.phone, listings: listings.length,
    devPassword: DEV_PASSWORD,
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
