import { ErrorWithCode } from "@lib/status/error";

export class ErrorUnauthorized extends ErrorWithCode {
  name = "UNAUTHORIZED";
  constructor(...a: ConstructorParameters<typeof ErrorWithCode>) {
    a[1] = { ...a[1], code: 401 };
    super(...a);
    this.message = a[0] ?? "Unauthorized";
  }
}
