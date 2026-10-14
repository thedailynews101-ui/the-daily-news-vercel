import { Request, Response } from "express";

import * as userService from "./user.service";
import { listUsersQuerySchema } from "./user.validation";
import sendResponse from "../../utils/sendResponse";

const actingUser = (req: Request): userService.ActingUser => ({
  id: req.user!.id,
  role: req.user!.role,
});

export const listUsers = async (req: Request, res: Response) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await userService.listUsers(query);

  sendResponse(res, {
    statusCode: 200,
    message: "Users retrieved successfully.",
    data: result,
  });
};

export const updateUserRole = async (req: Request, res: Response) => {
  const user = await userService.updateUserRole(
    actingUser(req),
    req.params["id"] as string,
    req.body,
    { ipAddress: req.ip }
  );

  sendResponse(res, {
    statusCode: 200,
    message: "User role updated successfully.",
    data: user,
  });
};
