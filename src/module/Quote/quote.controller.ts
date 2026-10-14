import { Request, Response } from "express";

import * as quoteService from "./quote.service";
import sendResponse from "../../utils/sendResponse";

export const listQuotes = async (_req: Request, res: Response) => {
  const quotes = await quoteService.listQuotes();

  sendResponse(res, {
    statusCode: 200,
    message: "Quotes retrieved successfully.",
    data: quotes,
  });
};

export const createQuote = async (req: Request, res: Response) => {
  const quote = await quoteService.createQuote(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Quote created successfully.",
    data: quote,
  });
};

export const updateQuote = async (req: Request, res: Response) => {
  const quote = await quoteService.updateQuote(req.params["id"] as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    message: "Quote updated successfully.",
    data: quote,
  });
};

export const deleteQuote = async (req: Request, res: Response) => {
  await quoteService.deleteQuote(req.params["id"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Quote deleted successfully.",
  });
};
