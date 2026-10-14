import { MiddleWidget } from "../../generated/prisma/enums";
import * as quoteService from "../Quote/quote.service";
import * as publicOpinionService from "../PublicOpinion/publicOpinion.service";
import * as weatherService from "../Weather/weather.service";
import * as widgetSettingService from "../WidgetSetting/widgetSetting.service";

export const getPublicWidgets = async (voterKey?: string, userId?: string) => {
  const [setting, weather] = await Promise.all([
    widgetSettingService.getWidgetSetting(),
    weatherService.getWeatherSnapshot(),
  ]);

  const middleWidget = setting.middleWidget;

  if (middleWidget === MiddleWidget.QUOTE) {
    const quote = await quoteService.getActiveQuote();
    return {
      weather,
      middleWidget,
      quote,
      publicOpinion: null,
    };
  }

  const publicOpinion = await publicOpinionService.getActivePublicOpinion(voterKey, userId);
  return {
    weather,
    middleWidget,
    quote: null,
    publicOpinion,
  };
};
