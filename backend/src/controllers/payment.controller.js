const crypto = require("crypto");
const prisma = require("../config/db");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");

function getRazorpay() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) return null;
  const Razorpay = require("razorpay");
  return new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
}

// POST /api/payments/create-order — e.g. for promoting a listing
const createOrder = asyncHandler(async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) return fail(res, 503, "Payments are not configured on this server yet (see backend/.env.example)");

  const { amount, purpose, propertyId } = req.body;
  if (!amount || amount <= 0) return fail(res, 422, "Invalid amount");

  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: "INR",
    receipt: `vc_${Date.now()}`,
  });

  const payment = await prisma.payment.create({
    data: { userId: req.user.id, propertyId: propertyId || null, amount, purpose: purpose || "listing_promotion", providerOrderId: order.id },
  });

  return ok(res, { orderId: order.id, amount: order.amount, currency: order.currency, paymentId: payment.id, keyId: env.razorpay.keyId }, 201);
});

// POST /api/payments/verify — called by the frontend after Razorpay checkout completes
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return fail(res, 422, "Missing payment fields");

  const expected = crypto
    .createHmac("sha256", env.razorpay.keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    await prisma.payment.updateMany({ where: { providerOrderId: razorpay_order_id }, data: { status: "FAILED" } });
    return fail(res, 400, "Payment signature verification failed");
  }

  await prisma.payment.updateMany({
    where: { providerOrderId: razorpay_order_id },
    data: { status: "PAID", providerPaymentId: razorpay_payment_id },
  });

  return ok(res, { verified: true });
});

module.exports = { createOrder, verifyPayment };
