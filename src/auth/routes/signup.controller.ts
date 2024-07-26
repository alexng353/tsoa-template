import { IncomingHttpHeaders } from "http";
import { Body, Controller, Header, Post, Query, Res, Route } from "tsoa";
import { Response } from "express";
import argon2 from "@node-rs/argon2";
import * as jose from "jose";

import { get_real_ip } from "../get-real-ip";
import { LogOut } from "../logout";
import { OTP } from "../otp";
import { Users } from "@app/schema/user.schema";
import { db, getFirst } from "@lib/db";
import { InternalServerError } from "@lib/status/error";
import { DAY } from "@lib/constants";
import { Sessions } from "@app/schema/session.schema";
import {
  FRONTEND_COOKIE_NAME,
  FRONTEND_COOKIE_OPTIONS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../constants";
import { logger } from "@lib/logger";
import { env } from "@lib/env";
import { JWS_SECRET } from "../jwt-helpers";
import { RedirectQuery, Z_RedirectQuery } from "../types";

type SignupBody = {
  username: string;
  password: string;
  email: string;
  code: string;
};

@Route("/auth/v1/signup")
export class AuthController extends Controller {
  @Post("/password")
  public async signup(
    @Body() body: SignupBody,
    @Res() response: Response,
    @Header() headers: IncomingHttpHeaders,
    @Query() _query: RedirectQuery,
  ): Promise<void> {
    const { success_url, error_url } = Z_RedirectQuery.parse(_query);

    const ip_address = get_real_ip(headers);
    try {
      // Log the user out to prevent bugs
      await LogOut(response, null, {
        reason: "User signing up for a new account",
      });

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
      const exp = new Date(iat.getTime() + 30 * DAY); // 30 days

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

      response.cookie(SESSION_COOKIE_NAME, session.id, SESSION_COOKIE_OPTIONS);
      response.cookie(
        FRONTEND_COOKIE_NAME,
        await new jose.SignJWT()
          .setProtectedHeader({ alg: "HS256" })
          .setSubject(user.id)

          .setIssuedAt(iat)
          .setExpirationTime(exp)

          .setIssuer(env.API_URL.toString())
          .setAudience(env.FRONTEND_URL.toString())
          .setJti(crypto.randomUUID())
          .sign(JWS_SECRET),
        FRONTEND_COOKIE_OPTIONS,
      );

      logger.info({
        event: "auth:signup_password",
        user_id: user.id,
        ip_address,
        msg: "User signed up successfully",
      });

      response.redirect(success_url + "?signup=successful");
    } catch (error) {
      logger.error({ err: error }, "Error in signup_password");
      response.redirect(error_url + "?error=auth_failed");
    }
    return;
  }
}
