import { Request as ExpressRequest } from "express";
import { ErrorUnauthorized } from "@lib/status/error";

const VALID_SCOPES = ["jwt", "session"];

export async function expressAuthentication(
  request: ExpressRequest,
  securityName: string,
  _scopes?: string[],
): Promise<unknown> {
  if (!VALID_SCOPES.includes(securityName)) {
    throw new Error("Invalid security name");
  }

  if (!request.user || !request.session || !request.user_password) {
    throw new ErrorUnauthorized();
  }

  return request.user;
}
