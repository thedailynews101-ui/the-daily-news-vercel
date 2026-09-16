import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

import config from "../config";
import { Prisma } from "../generated/prisma/client";
import AppError from "../utils/AppError";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorDetails: unknown = undefined;
  let errorCode: string | undefined = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";
    errorDetails = err.flatten().fieldErrors;
  } else if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid authentication token.";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "A record with this value already exists.";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "The requested record was not found.";
    }
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errorDetails,
    stack: config.isProduction ? undefined : err instanceof Error ? err.stack : undefined,
  });
};

export default globalErrorHandler;
