import * as jose from "jose";

import { env } from "@lib/env";

export const JWS_SECRET = new TextEncoder().encode(env.JWS_SECRET);

/**
 * @deprecated
 *
 * THIS IS FOR ALEX TO REMEMBER HOW TO MAKE JWTs.
 * It's basically example code
 */
async function makeJWT(data: Record<string, unknown>, exp = "30d") {
  return await new jose.SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(env.API_URL.toString())
    .setAudience(env.FRONTEND_URL.toString())
    .setExpirationTime(exp)
    .sign(JWS_SECRET);
}

// @ts-expect-error - This is just for Alex to remember how to make JWTs
if (makeJWT) null;
