"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  authenticate,
  registerLearner,
} from "@/adapters/identity/auth-service";
import { safeReturnTo } from "@/lib/auth-navigation";
import { beginSession, endSession, currentUser } from "@/lib/session";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);

export async function registerAction(formData: FormData) {
  const destination = safeReturnTo(formData.get("next"));
  if (await currentUser()) redirect(destination);
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
  if (!parsed.success)
    redirect(
      `/register?${new URLSearchParams({ error: "invalid", next: destination })}`,
    );

  const user = await registerLearner(parsed.data);
  if (!user)
    redirect(
      `/register?${new URLSearchParams({ error: "exists", next: destination })}`,
    );
  await beginSession(user.id);
  redirect(destination);
}

export async function loginAction(formData: FormData) {
  const destination = safeReturnTo(formData.get("next"));
  if (await currentUser()) redirect(destination);
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success)
    redirect(
      `/login?${new URLSearchParams({ error: "invalid", next: destination })}`,
    );

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user)
    redirect(
      `/login?${new URLSearchParams({ error: "credentials", next: destination })}`,
    );
  await beginSession(user.id);
  redirect(destination);
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}
