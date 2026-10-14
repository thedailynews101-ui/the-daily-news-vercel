import { Request, Response } from "express";

import * as widgetSettingService from "./widgetSetting.service";
import sendResponse from "../../utils/sendResponse";

export const getWidgetSetting = async (_req: Request, res: Response) => {
  const setting = await widgetSettingService.getWidgetSetting();

  sendResponse(res, {
    statusCode: 200,
    message: "Widget settings retrieved successfully.",
    data: setting,
  });
};

export const updateWidgetSetting = async (req: Request, res: Response) => {
  const setting = await widgetSettingService.updateWidgetSetting(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: "Widget settings updated successfully.",
    data: setting,
  });
};
