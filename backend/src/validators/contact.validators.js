const { z } = require("zod");

const contactSchema = z.object({
  name: z.string().min(2, "Enter your name").max(80),
  email: z.string().email("Enter a valid email address"),
  message: z.string().min(10, "Add a bit more detail (10+ characters)").max(2000),
});

module.exports = { contactSchema };
