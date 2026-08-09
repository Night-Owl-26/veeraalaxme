const { z } = require("zod");

const startThreadSchema = z.object({
  sellerId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
});

const sendMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

module.exports = { startThreadSchema, sendMessageSchema };
