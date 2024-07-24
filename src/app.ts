import express, {
  Response as ExpressResponse,
  Request as ExpressRequest,
  NextFunction,
} from "express";
import { RegisterRoutes } from "../build/routes";
import { ValidateError } from "tsoa";

export const app = express();

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());

RegisterRoutes(app);

app.use(function errorHandler(
  err: unknown,
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction,
): ExpressResponse | void {
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }

  next();
});
