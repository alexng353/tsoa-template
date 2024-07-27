import { Body, Post, Response, Route } from "tsoa";
import argon2 from "@node-rs/argon2";
import * as jose from "jose";

import { OTP } from "../otp";
import { Users } from "@app/schema/user.schema";
import { db, getFirst } from "@lib/db";
import { InternalServerError } from "@lib/status/error";
import { DAY } from "@lib/constants";
import { Sessions } from "@app/schema/session.schema";
import { logger } from "@lib/logger";
import { env } from "@lib/env";
import { JWS_SECRET } from "../jwt-helpers";
import { NController } from "@lib/ncontroller";
import { OTPCode } from "../../types";

type MobileSignupBody = {
  username: string;
  password: string;
  email: string;
  code: OTPCode;
};

@Route("/auth/v1/mobile/signup")
export class MobileSignupController extends NController {
  @Post("/password")
  @Response<void>(302, "Redirect to success_url or error_url")
  public async signup(@Body() body: MobileSignupBody) {
    const ip_address = this.getRealIp();
    try {
      await OTP.burnOTP(body.email, body.code).catch((error) => {
        throw new Error("Failed to verify email", {
          cause: error,
        });
      });

      const hash = await argon2.hash(body.password);

      const user = await db
        .insert(Users)
        .values({
          email: body.email,
          username: body.username,
          // TODO: Add real name to body (?)
          name: "",
          password_hash: hash,
          known_ips: ip_address ? [ip_address] : [],
          is_email_verified: true,
        })
        .returning()
        .then(getFirst)
        .catch((error) => {
          console.error(error);
          throw new InternalServerError("Failed to create user", {
            cause: error,
          });
        });

      if (!user) {
        throw new Error("Failed to create user");
      }

      const iat = new Date();
      // instead of doing this, we should do refresh tokens (lol)
      const exp = new Date(iat.getTime() + 365 * DAY); // 1 year

      const session = await db
        .insert(Sessions)
        .values({
          user_id: user.id,
          created_at: iat,
          expires_at: exp,
          ip_address: ip_address,
        })
        .returning()
        .then(getFirst);

      if (!session) {
        throw new InternalServerError("Failed to create session");
      }

      const jwt = await new jose.SignJWT()
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.id)

        .setIssuedAt(iat)
        .setExpirationTime(exp)

        .setIssuer(env.API_URL.toString())
        .setAudience(env.FRONTEND_URL.toString())
        .setJti(crypto.randomUUID())
        .sign(JWS_SECRET);

      logger.info({
        event: "auth:mobile:signup_password",
        user_id: user.id,
        ip_address,
        msg: "User signed up successfully",
      });

      return jwt;
    } catch (error) {
      logger.error({ err: error }, "Error in signup_password");
      return { error: "signup_failed" };
    }
  }
}
