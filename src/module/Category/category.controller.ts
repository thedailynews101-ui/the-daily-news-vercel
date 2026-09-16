import { Request, Response } from "express";

import * as categoryService from "./category.service";
import sendResponse from "../../utils/sendResponse";

export const listCategories = async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();

  sendResponse(res, {
    statusCode: 200,
    message: "Categories retrieved successfully.",
    data: categories,
  });
};

export const createCategory = async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Category created successfully.",
    data: category,
  });
};

export const updateCategory = async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params["id"] as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    message: "Category updated successfully.",
    data: category,
  });
};

export const deleteCategory = async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params["id"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Category deleted successfully.",
  });
};
