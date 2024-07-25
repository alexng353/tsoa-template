import { ErrorWithCode } from "@lib/status/error";
import { logger } from "@lib/logger";
import type { Request, Response, NextFunction } from "express";
import { env } from "@lib/env";
import { MulterError } from "multer";
import { ErrorUnauthorized } from "@lib/status/error";

type ErrorWithCause = {
  name?: string;
  message?: string;
  stack?: string | undefined;
  cause?: ErrorWithCause;
};

const max_recursions = 25;
function recursive_parse_error(
  error: unknown,
  recursions = 0,
): ErrorWithCause | unknown {
  if (recursions > max_recursions) {
    return { error, message: "Max Recursions Reached" };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ? recursive_parse_error(error.cause) : undefined,
    };
  }
  return error;
}

export function errorMiddleware(
  error: unknown,
  request: Request,
  response: Response,
  _n: NextFunction,
) {
  const error_id = error instanceof ErrorWithCode ? error.error_id : undefined;
  const request_id = request.tracing.request_id;

  const error_with_cause = recursive_parse_error(error);
  logger.error({
    path: request.path,
    method: request.method,
    user_id: request.user?.id ?? null,
    ip: request.tracing.client_ip,
    error_id,
    request_id,
    timestamp: request.tracing.timestamp,
    msg: `[handle-error] ERROR ON PATH ${request.method} ${request.path}`,
    error_message: error_with_cause,
    error_code: error instanceof ErrorWithCode ? error.error_code : undefined,
  });

  if (error instanceof ErrorWithCode) {
    let cause = env.NODE_ENV === "development" ? error.cause : null;

    if (error instanceof ErrorUnauthorized) {
      cause = "Unauthorized";
    }

    return response.status(error.status_code).json({
      status: error.status_code,
      success: false,
      error: { message: error.message, name: error.name, id: error.error_id },
      cause: cause ? recursive_parse_error(cause) : undefined,
      request_id: request_id,
      request_timestamp: request.tracing.timestamp,
      error_code: error.error_code,
    });
  }

  if (error instanceof MulterError) {
    return handle_multer_error(error, response);
  }

  logger.error(
    { error_message: error, request_id },
    "[handle-error] Error: Caught Server Error",
  );

  if (env.NODE_ENV === "development") {
    return response.status(500).json({
      success: false,
      error: error_with_cause ?? "INTERNAL SERVER ERROR",
      id: error_id,
      request_id: request_id,
      request_timestamp: request.tracing.timestamp,
    });
  }

  return response.status(500).json({
    success: false,
    error: "INTERNAL SERVER ERROR",
    id: error_id,
    request_id: request_id,
    request_timestamp: request.tracing.timestamp,
  });
}

function handle_multer_error(error: MulterError, response: Response) {
  switch (error.code) {
    case "LIMIT_FILE_SIZE": {
      return response.status(400).json({
        success: false,
        error: "FILE TOO LARGE",
      });
    }
    default: {
      return response.status(500).json({
        success: false,
        error: "INTERNAL SERVER ERROR",
      });
    }
  }
}
