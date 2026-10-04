"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { authenticate, registerLearner } from "@/adapters/identity/auth-service";
import { beginSession, endSession } from "@/lib/session";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);

export async function registerAction(formData: FormData) {
  const parsed = z
    .object({
      displayName: z.string().trim().min(1).max(80),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      displayName: formData.get("displayName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) redirect("/register?error=invalid");

  const user = await registerLearner(parsed.data);
  if (!user) redirect("/register?error=exists");
  await beginSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect("/login?error=invalid");

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) redirect("/login?error=credentials");
  await beginSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

