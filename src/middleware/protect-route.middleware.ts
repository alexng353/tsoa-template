import { env } from "@lib/env";
import { logger } from "@lib/logger";
import type { NextFunction, Request, Response } from "express";

async function protectRouteMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const user = request.user;
    if (!user) next(new Error("Unauthorized"));

    next();
  } catch (error) {
    if (env.NODE_ENV !== "production") {
      logger.warn(`No user found (rp) ${request.url}\n\t`, error);
    }
    next(new Error("Unauthorized", {
      cause: error,
    }));
    // throw new ErrorUnauthorized("Unauthorized", {
    //   cause: error,
    // });
  }
}

export const protectRoute = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => protectRouteMiddleware(request, response, next);
