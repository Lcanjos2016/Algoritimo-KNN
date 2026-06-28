import crypto from "node:crypto";
import { isSupabaseConfigured, supabase, supabaseAdmin } from "./supabase.js";

const demoUsers = new Map([
  [
    "demo@cinematch.com",
    {
      id: "demo-user",
      name: "Usuario Demo",
      email: "demo@cinematch.com",
      passwordHash: hashPassword("123456"),
    },
  ],
]);
const demoSessions = new Map();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createDemoSession(user) {
  const token = crypto.randomUUID();
  demoSessions.set(token, user);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    provider: "demo",
  };
}

function createAuthError(error, fallbackMessage, fallbackStatus = 400) {
  const isEmailRateLimit = error?.code === "over_email_send_rate_limit" ||
    error?.message === "email rate limit exceeded";
  const messageByCode = {
    over_email_send_rate_limit:
      "Limite de envio de emails do Supabase atingido. Aguarde alguns minutos ou desative a confirmacao de email durante o desenvolvimento.",
  };
  const statusByCode = {
    over_email_send_rate_limit: 429,
  };
  const authError = new Error(
    isEmailRateLimit
      ? messageByCode.over_email_send_rate_limit
      : messageByCode[error?.code] || error?.message || fallbackMessage,
  );
  authError.status = isEmailRateLimit
    ? 429
    : statusByCode[error?.code] || error?.status || fallbackStatus;
  authError.code = error?.code;
  return authError;
}

export async function registerUser({ name, email, password }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      throw createAuthError(error, "Nao foi possivel criar a conta.");
    }

    if (data.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        name,
        email,
      });
    }

    return {
      token: data.session?.access_token || null,
      user: {
        id: data.user.id,
        name,
        email,
      },
      provider: "supabase",
      requiresEmailConfirmation: !data.session,
    };
  }

  if (demoUsers.has(email)) {
    throw new Error("Email ja cadastrado.");
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
  };
  demoUsers.set(email, user);
  return createDemoSession(user);
}

export async function loginUser({ email, password }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw createAuthError(error, "Email ou senha invalidos.", 401);
    }

    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email,
        email: data.user.email,
      },
      provider: "supabase",
    };
  }

  const user = demoUsers.get(email);

  if (!user || user.passwordHash !== hashPassword(password)) {
    throw new Error("Email ou senha invalidos.");
  }

  return createDemoSession(user);
}

export async function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email,
      email: data.user.email,
    };
  }

  const user = demoSessions.get(token);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
