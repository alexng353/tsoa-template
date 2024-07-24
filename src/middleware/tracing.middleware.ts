import { REALIP_HEADER } from "@lib/constants";
import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

export function tracingMiddleware(
  request: Request,
  _: Response,
  next: NextFunction,
) {
  request.tracing = {
    timestamp: Date.now(),
    request_id: crypto.randomUUID(),
    path: request.path,
    method: request.method,
    client_ip:
      request.header(REALIP_HEADER) ||
      request.header("x-forwarded-for")?.split(",")[0] ||
      "",
  };

  next();
}
