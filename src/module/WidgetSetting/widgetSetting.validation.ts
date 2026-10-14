import { z } from "zod";

export const updateWidgetSettingSchema = z.object({
  middleWidget: z.enum(["QUOTE", "PUBLIC_OPINION"]),
});

export type UpdateWidgetSettingInput = z.infer<typeof updateWidgetSettingSchema>;
