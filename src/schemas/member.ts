import { z } from "zod";
import { organizationSummarySchema } from "@/schemas/admin";
import { publicUserSchema } from "@/schemas/auth";

export const memberTeamSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
});

export const memberUserSchema = publicUserSchema.extend({
  organization: organizationSummarySchema.nullable(),
  teams: z.array(memberTeamSummarySchema),
});

export const memberListResultSchema = z.object({
  items: z.array(memberUserSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const memberFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  organizationId: z.string().optional(),
  temporaryPassword: z
    .string()
    .refine((value) => value.length === 0 || value.length >= 8, {
      message: "Temporary password must be at least 8 characters",
    }),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  teamIds: z.array(z.string()),
});
