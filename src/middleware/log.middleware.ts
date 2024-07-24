import { REALIP_HEADER } from "@lib/constants";
import { env } from "@lib/env";
import { logger } from "@lib/logger";
import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

export async function logMiddleware(
  request: Request<ParamsDictionary, unknown, unknown>,
  _: Response,
  next: NextFunction,
) {
  if (env.NODE_ENV === "test") return next();

  const user = request.user;
  const headers = request.headers;

  const size = Buffer.byteLength(JSON.stringify(request.body), "utf8");
  const size_too_big = size > 5 * 1024 * 1024;

  const headers_without_cookies = { ...headers };
  delete headers_without_cookies.cookie;

  logger.info(
    {
      method: request.method,
      url: request.url,
      query: request.query,
      client_real_ip:
        headers[REALIP_HEADER] ||
        request.headers["x-forwarded-for"]?.toString().split(",").at(0),
      edge_node_region: headers["Fly-Region"],
      "X-Forwarded-For": headers["X-Forwarded-For"],
      FLY_REGION: env.FLY_REGION,
      headers: headers_without_cookies,
      body: size_too_big ? "[too big to log]" : request.body,
      // user_kinde_id: user ? user.kinde_id : null,
      user_mongo_id: user ? user.id : null,
    },
    `${request.method} ${request.url}`,
  );

  next();
}
