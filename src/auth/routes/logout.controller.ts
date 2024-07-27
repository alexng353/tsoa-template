import { Get, Post, Route, Request, Queries } from "tsoa";

import type { Request as ExpressRequest } from "express";

import { FRONTEND_COOKIE_NAME, SESSION_COOKIE_NAME } from "../constants";
import { db } from "@lib/db";
import { Sessions } from "@app/schema";
import { eq } from "drizzle-orm";
import { Z_RedirectQuery } from "../types";
import { NController } from "@lib/ncontroller";

@Route("/auth/v1/")
export class LogOutController extends NController {
  @Post("/logout")
  async logout(
    @Request() request: ExpressRequest,
    @Queries()
    _query: {
      success_url: string;
      error_url: string;
    },
  ) {
    const { success_url, error_url } = Z_RedirectQuery.parse(_query);
    const session_id = request.cookies[SESSION_COOKIE_NAME];

    if (!session_id) {
      // response.redirect(error_url + "?error=not_logged_in");
      return;
    }

    if (typeof session_id !== "string") {
      // response.redirect(error_url + "?error=invalid_session_id");
      return;
    }

    await db
      .update(Sessions)
      .set({ force_expire: true, reason_force_expire: "User Logged Out" })
      .where(eq(Sessions.id, session_id));

    this.clearCookie(SESSION_COOKIE_NAME);
    this.clearCookie(FRONTEND_COOKIE_NAME);

    // await LogOut(response, session_id, {
    //   event: "auth:logout",
    //   reason: "User logged out",
    //   user_id: request.user?.id,
    //   msg: "User logged out successfully",
    // });

    // response.redirect(success_url + "?logout=successful");
  }

  @Get("/logout")
  getLogout = this.logout;
}
