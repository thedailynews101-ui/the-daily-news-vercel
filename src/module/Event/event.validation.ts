import { z } from "zod";

const title = z.string().trim().min(1, "Title is required").max(200);
const position = z.coerce.number().int().min(0).optional();
const externalUrl = z
  .string()
  .trim()
  .url("URL must be a valid URL")
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "URL must start with http:// or https://",
  });

export const createEventGroupSchema = z.object({
  title,
  position,
});

export const updateEventGroupSchema = createEventGroupSchema.partial().refine(
  (value) => value.title !== undefined || value.position !== undefined,
  { message: "At least one field is required." }
);

export const createEventItemSchema = z.object({
  title,
  url: externalUrl,
  position,
});

export const updateEventItemSchema = z
  .object({
    title: title.optional(),
    url: externalUrl.optional(),
    position,
  })
  .refine((value) => value.title !== undefined || value.url !== undefined || value.position !== undefined, {
    message: "At least one field is required.",
  });

export type CreateEventGroupInput = z.infer<typeof createEventGroupSchema>;
export type UpdateEventGroupInput = z.infer<typeof updateEventGroupSchema>;
export type CreateEventItemInput = z.infer<typeof createEventItemSchema>;
export type UpdateEventItemInput = z.infer<typeof updateEventItemSchema>;
