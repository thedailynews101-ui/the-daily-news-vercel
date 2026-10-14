import { Request, Response } from "express";

import * as eventService from "./event.service";
import sendResponse from "../../utils/sendResponse";

export const listEventGroups = async (_req: Request, res: Response) => {
  const groups = await eventService.listEventGroups();

  sendResponse(res, {
    statusCode: 200,
    message: "Event groups retrieved successfully.",
    data: groups,
  });
};

export const createEventGroup = async (req: Request, res: Response) => {
  const group = await eventService.createEventGroup(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Event group created successfully.",
    data: group,
  });
};

export const updateEventGroup = async (req: Request, res: Response) => {
  const group = await eventService.updateEventGroup(req.params["id"] as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    message: "Event group updated successfully.",
    data: group,
  });
};

export const deleteEventGroup = async (req: Request, res: Response) => {
  await eventService.deleteEventGroup(req.params["id"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Event group deleted successfully.",
  });
};

export const createEventItem = async (req: Request, res: Response) => {
  const item = await eventService.createEventItem(req.params["groupId"] as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Event item created successfully.",
    data: item,
  });
};

export const updateEventItem = async (req: Request, res: Response) => {
  const item = await eventService.updateEventItem(req.params["id"] as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    message: "Event item updated successfully.",
    data: item,
  });
};

export const deleteEventItem = async (req: Request, res: Response) => {
  await eventService.deleteEventItem(req.params["id"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Event item deleted successfully.",
  });
};
