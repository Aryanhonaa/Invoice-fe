import { apiRequest } from "@/lib/api/client";
import { publicUserSchema } from "@/schemas/auth";
import type { PublicUser } from "@/types/auth";

export async function login(email: string, password: string): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return publicUserSchema.parse(data.user);
}

export async function logout(): Promise<void> {
  await apiRequest<{ loggedOut: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>("/api/auth/me");
  return publicUserSchema.parse(data.user);
}
