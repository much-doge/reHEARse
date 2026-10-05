export function validateProductionConfig(env = process.env) {
  if (env.NODE_ENV !== "production") throw new Error("production_node_env_required");
  if (!/^[a-f0-9]{64,}$/i.test(env.POSTGRES_PASSWORD ?? "")) throw new Error("strong_database_password_required");
  if (!/^[a-f0-9]{64,}$/i.test(env.SESSION_SECRET ?? "")) throw new Error("strong_session_secret_required");
  if (env.SESSION_COOKIE_SECURE !== "true") throw new Error("secure_cookie_required");
  const origin = new URL(env.PUBLIC_APP_ORIGIN ?? "");
  if (origin.protocol !== "https:" || origin.origin !== env.PUBLIC_APP_ORIGIN) throw new Error("explicit_https_origin_required");
  if (env.FEEDBACK_PROVIDER !== "openai" || !env.OPENAI_API_KEY || !env.OPENAI_MODEL) throw new Error("explicit_openai_configuration_required");
}
