import { IS_PRODUCTION, REALIP_HEADER } from "@lib/constants";
import { IncomingHttpHeaders } from "http";

/** @deprecated Use NController#getRealIp instead */
export function get_real_ip(
  headers: IncomingHttpHeaders,
): string | "localhost" {
  const ip_address = headers[REALIP_HEADER];
  if (!ip_address && !IS_PRODUCTION) return "localhost" as const;
  if (typeof ip_address === "string") {
    return ip_address;
  }

  throw new Error("Invalid IP Address");
}
