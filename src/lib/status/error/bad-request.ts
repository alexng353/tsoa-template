import { ErrorWithCode } from "@lib/status/error";

/**
 * ErrorBadRequest
 * @description throw a 400 error with a message or default message "Bad Request"
 */
export class ErrorBadRequest extends ErrorWithCode {
  name = "BAD_REQUEST";
  constructor(...a: ConstructorParameters<typeof ErrorWithCode>) {
    a[1] = { ...a[1], code: 400 };
    super(...a);
    this.message = a[0] ?? "Bad Request";
  }
}
