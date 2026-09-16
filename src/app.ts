import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";

import config from "./config";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import router from "./routes";

const app: Application = express();

app.use(cors({ origin: config.clientUrl, credentials: true }));

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Parse cookies (access/refresh tokens are read from here)
app.use(cookieParser());

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, The Daily News Server!");
});

app.use(router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
