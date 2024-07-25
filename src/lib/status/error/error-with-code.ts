import { logger } from "@lib/logger";
import { v4 as uuid } from "uuid";

export class ErrorWithCode extends Error {
  public status_code: number;
  public error_id: string;
  public request_id: string;
  public error_code: number;
  constructor(
    message: string = "Internal Server Error",
    options?: {
      cause?: Error | unknown;
      code?: number;
      request_id?: string;
      error_code?: number;
    },
  ) {
    super(message, options);

    this.status_code = options?.code ?? 500;
    this.error_id = uuid();
    this.request_id = options?.request_id ?? "";
    this.error_code = options?.error_code ?? -1;

    logger.trace({
      error_message: message,
      status_code: this.status_code,
      error_id: this.error_id,
      error_code: this.error_code,
      request_id: this.request_id,
      from: "ErrorWithCode",
    });

    Error.captureStackTrace(this, ErrorWithCode);
  }

  toJSON() {
    return {
      error_message: this.message,
      status_code: this.status_code,
      error_id: this.error_id,
      request_id: this.request_id,
    };
  }
}
