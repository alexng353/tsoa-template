import { ErrorWithCode } from "@lib/status/error";

export class ErrorNotFound extends ErrorWithCode {
  name = "NOT_FOUND";
  constructor(...a: ConstructorParameters<typeof ErrorWithCode>) {
    a[1] = { ...a[1], code: 404 };
    super(...a);
    this.message = a[0] ?? "Not Found";
  }
}
