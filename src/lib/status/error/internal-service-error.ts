import { ErrorWithCode } from "@lib/status/error";

export class InternalServerError extends ErrorWithCode {
  name = "INTERNAL_SERVER_ERROR";
  constructor(...a: ConstructorParameters<typeof ErrorWithCode>) {
    a[1] = { ...a[1], code: 500 };
    super(...a);
    this.message = a[0] ?? "Internal Server Error";
  }
}
