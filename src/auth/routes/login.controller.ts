import { z } from "zod";
import argon2 from "@node-rs/argon2";
import { Body, Header, Post, Query, Res, Route } from "tsoa";
import { eq, or } from "drizzle-orm";
import * as jose from "jose";

import { logger } from "@lib/logger";
import { DAY } from "@lib/constants";
import { ErrorBadRequest } from "@lib/status/error";
import { LogOut } from "../logout";
import { db, getFirst } from "@lib/db";
import { Sessions, Users } from "@app/schema";
import {
  FRONTEND_COOKIE_NAME,
  FRONTEND_COOKIE_OPTIONS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../constants";

import type { IncomingHttpHeaders } from "http";
import type { Response } from "express";
import { get_real_ip } from "../get-real-ip";
import { RedirectQuery, Z_RedirectQuery } from "../types";

type LoginBody = {
  username: string;
  password: string;
};

@Route("/auth/v1/login")
export class LoginPasswordController {
  @Post("/password")
  async login_password(
    @Body() body: LoginBody,
    @Res() response: Response,
    @Header() headers: IncomingHttpHeaders,
    @Query() _query: RedirectQuery,
  ) {
    const { success_url, error_url } = Z_RedirectQuery.parse(_query);

    const ip_address = get_real_ip(headers);
    try {
      // TODO: Research: Should we clear the cookie here?
      await LogOut(response, null, {
        reason: "User logging into another account",
      });

      // TODO: EDU-2241: Check IP Address on login

      const user = await db
        .select()
        .from(Users)
        .where(
          or(eq(Users.username, body.username), eq(Users.email, body.username)),
        )
        .then(getFirst);

      if (!user) {
        response.redirect(error_url + "?error=user_not_found");
        return;
      }

      const is_valid = await argon2.verify(user.password_hash, body.password);

      if (!is_valid) {
        response.redirect(error_url + "?error=invalid_password");
        return;
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
        throw new ErrorBadRequest("Failed to create session");
      }

      response.cookie(SESSION_COOKIE_NAME, session.id, SESSION_COOKIE_OPTIONS);
      response.cookie(
        FRONTEND_COOKIE_NAME,
        await makeJWT({
          user_id: user.id,
          session_iat: iat.getTime() / 1000,
          session_exp: exp.getTime() / 1000,
          is_temporary_password: !!user.is_temporary_password,
        }),
        FRONTEND_COOKIE_OPTIONS,
      );

      logger.info({
        event: "auth:login_password",
        user_id: user.id,
        ip_address,
        msg: "User logged in successfully",
      });

      response.redirect(success_url + "?login=successful");
    } catch (error) {
      logger.error({ err: error }, "Error in login_password");
      response.redirect(error_url + "?error=auth_failed");
    }
  }
}
