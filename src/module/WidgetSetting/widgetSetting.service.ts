import { MiddleWidget } from "../../generated/prisma/enums";
import prisma from "../../lib/prisma";
import type { UpdateWidgetSettingInput } from "./widgetSetting.validation";

const DEFAULT_ID = "default";

export const getWidgetSetting = async () => {
  const setting = await prisma.siteSetting.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, middleWidget: MiddleWidget.QUOTE },
    update: {},
  });

  return {
    id: setting.id,
    middleWidget: setting.middleWidget,
    updatedAt: setting.updatedAt,
  };
};

export const updateWidgetSetting = async (input: UpdateWidgetSettingInput) => {
  const setting = await prisma.siteSetting.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, middleWidget: input.middleWidget },
    update: { middleWidget: input.middleWidget },
  });

  return {
    id: setting.id,
    middleWidget: setting.middleWidget,
    updatedAt: setting.updatedAt,
  };
};
