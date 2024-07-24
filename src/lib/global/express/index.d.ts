import { Session } from "@app/schema/sessions";
import { User } from "@app/schema/users";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      // for auth
      user: Omit<User, "password_hash"> | null;
      user_password: string | null;
      session: Pick<
        Session,
        "user_id" | "id" | "ip_address" | "created_at" | "expires_at"
      > | null;

      // for tracing
      tracing: {
        timestamp: number;
        request_id: string;
        path: string;
        method: string;
        client_ip: string;
      };
    }
  }
}
