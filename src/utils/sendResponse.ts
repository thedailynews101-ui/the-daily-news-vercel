import { Response } from "express";

type SendResponseOptions<T> = {
  statusCode: number;
  success?: boolean;
  message: string;
  data?: T;
};

const sendResponse = <T>(res: Response, options: SendResponseOptions<T>) => {
  const { statusCode, success = true, message, data } = options;

  return res.status(statusCode).json({
    success,
    message,
    data: data ?? null,
  });
};

export default sendResponse;
