import express, {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from "express";
import { RegisterRoutes } from "../build/routes";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";

import { IS_PRODUCTION } from "@lib/constants";
import { errorMiddleware } from "./middleware/handle-error.middleware";
import { auth } from "./auth/auth-middleware";

export const app = express();

app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());

if (!IS_PRODUCTION) {
  app.use(
    "/swagger",
    swaggerUi.serve,
    async (_req: ExpressRequest, res: ExpressResponse) => {
      return res.send(
        swaggerUi.generateHTML(await import("../build/swagger.json")),
      );
    },
  );
}

app.use(auth());
RegisterRoutes(app);

app.use(errorMiddleware);
