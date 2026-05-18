import { API_URL } from "../config";

export const PASSWORD_CONFIRMATION_REQUIRED = "PASSWORD_CONFIRMATION_REQUIRED";

type PasswordConfirmationHandler = () => Promise<void>;

let handler: PasswordConfirmationHandler | null = null;
let inFlight: Promise<void> | null = null;

export interface ApiErrorPayload {
  code?: string;
}

export const isPasswordConfirmationChallenge = (payload: unknown): boolean => {
  return isRecord(payload) && payload.code === PASSWORD_CONFIRMATION_REQUIRED;
};

export const registerPasswordConfirmationHandler = (
  nextHandler: PasswordConfirmationHandler,
) => {
  handler = nextHandler;
  return () => {
    if (handler === nextHandler) handler = null;
  };
};

export const requestPasswordConfirmation = async (): Promise<void> => {
  if (inFlight) return inFlight;
  if (!handler) throw new Error("Password confirmation UI is not available");

  inFlight = handler().finally(() => {
    inFlight = null;
  });
  return inFlight;
};

export const confirmCurrentPassword = async (password: string): Promise<void> => {
  const response = await fetch(`${API_URL}api/auth/password-confirmation`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(readErrorMessage(body, response.statusText));
  }
};

const readErrorMessage = (body: unknown, fallback: string): string => {
  if (isRecord(body) && typeof body.error === "string") return body.error;
  if (isRecord(body) && typeof body.message === "string") return body.message;
  return fallback || "Password confirmation failed";
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};
