import { z } from "zod";

export const createRoomSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(120),
  floor: z.string().max(20).optional(),
  capacity: z.number().int().min(1).max(500),
  amenities: z.array(z.string().max(40)).max(20).default([]),
});

export const updateRoomSchema = createRoomSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
