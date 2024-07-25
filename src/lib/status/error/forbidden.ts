import { ErrorWithCode } from "@lib/status/error";

export class ErrorForbidden extends ErrorWithCode {
  name = "FORBIDDEN";
  constructor(...a: ConstructorParameters<typeof ErrorWithCode>) {
    a[1] = { ...a[1], code: 403 };
    super(...a);
    this.message = a[0] ?? "Access Denied";
  }
}
