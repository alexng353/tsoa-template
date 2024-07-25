import { ErrorWithCode } from "@lib/status/error";

export class ErrorNotImplemented extends ErrorWithCode {
  name = "NOT_IMPLEMENTED";
  constructor(...a: ConstructorParameters<typeof ErrorWithCode>) {
    a[1] = { ...a[1], code: 500 };
    super(...a);
    this.message = a[0] ?? "Internal Server Error";
  }
}
