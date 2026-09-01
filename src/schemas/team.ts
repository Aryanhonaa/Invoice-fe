import { z } from "zod";
import { organizationSummarySchema } from "@/schemas/admin";

export const teamSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  memberCount: z.number(),
  organization: organizationSummarySchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const teamListResultSchema = z.object({
  items: z.array(teamSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const teamFormSchema = z.object({
  name: z.string().trim().min(1, "Team name is required"),
  description: z.string().trim().optional(),
  organizationId: z.string().optional(),
});
