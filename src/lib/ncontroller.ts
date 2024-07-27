import { IS_PRODUCTION, REALIP_HEADER } from "@lib/constants";
import { CookieOptions } from "@app/auth/constants";
import { Controller } from "tsoa";

export class NController extends Controller {
  appendHeader(fieldName: string, value: string | Array<string>) {
    const prev = this.getHeader(fieldName);
    let newValue = value;

    if (prev) {
      // concat the new and prev vals
      newValue = Array.isArray(prev)
        ? prev.concat(value)
        : Array.isArray(value)
          ? [prev].concat(value)
          : [prev, value];
    }

    return this.setHeader(fieldName, newValue);
  }

  clearCookie(name: string) {
    const prev = this.getHeader("Set-Cookie");

    if (prev) {
      const cookies = Array.isArray(prev) ? prev : [prev];
      const cleared = cookies.filter(
        (cookie) => !cookie.startsWith(`${name}=`),
      );

      this.setHeader("Set-Cookie", cleared);
    }
  }

  setCookie(name: string, value: string, options: CookieOptions = {}) {
    const val =
      typeof value === "object" ? "j:" + JSON.stringify(value) : String(value);

    this.appendHeader("Set-Cookie", serializeCookie(name, val, options));
  }

  getRealIp(): string | "localhost" {
    const ip_address = this.getHeader(REALIP_HEADER);
    if (!ip_address && !IS_PRODUCTION) return "localhost" as const;
    if (typeof ip_address === "string") {
      return ip_address;
    }

    throw new Error("Invalid or Missing IP Address");
  }

  location(url: string | URL) {
    this.setHeader("Location", url.toString());
  }

  /**
   * Call this function and then return in tsoa
   */
  redirect(url: string | URL) {
    this.location(url);
    this.setStatus(302);
  }
}

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const optionsString = Object.entries(options)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  return `${name}=${value}; ${optionsString}`;
}
