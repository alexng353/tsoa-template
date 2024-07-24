import { REALIP_HEADER } from "@lib/constants";
import rateLimit from "express-rate-limit";

/**
 * Rate limiter middleware.
 *
 * @param rate - The max rate limit per windowMs.
 * @param windowMs - The window in milliseconds. Defaults to 1000ms.
 */
export const limiter = (rate: number, windowMs = 1000) =>
  rateLimit({
    windowMs, // 1 second
    max: rate, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: true,
    keyGenerator: (request) => {
      return (
        (request.header(REALIP_HEADER)?.toString() ||
          request.headers["x-forwarded-for"]?.toString().split(",").at(0)) ??
        ""
      );
    },
  });
