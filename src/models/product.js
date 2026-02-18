const { z } = require("zod");

const productCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative()
});

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional()
});

module.exports = {
  productCreateSchema,
  productUpdateSchema
};
