import { Request as ExpressRequest } from "express";
import { IS_PRODUCTION, REALIP_HEADER } from "@lib/constants";
import { IncomingHttpHeaders } from "http";
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

export function get_real_ip(
  headers: IncomingHttpHeaders,
): string | "localhost" {
  const ip_address = headers[REALIP_HEADER];
  if (!ip_address && !IS_PRODUCTION) return "localhost" as const;
  if (typeof ip_address === "string") {
    return ip_address;
  }

  throw new Error("Invalid IP Address");
}
