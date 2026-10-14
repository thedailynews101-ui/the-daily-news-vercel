import { z } from "zod";

const question = z.string().trim().min(1, "Question is required").max(300);
const optionLabel = z.string().trim().min(1, "Option label is required").max(120);

const optionsSchema = z
  .array(optionLabel)
  .min(2, "At least 2 options are required.")
  .max(4, "At most 4 options are allowed.")
  .refine((options) => new Set(options.map((o) => o.toLowerCase())).size === options.length, {
    message: "Option labels must be unique.",
  });

export const createPublicOpinionSchema = z.object({
  question,
  options: optionsSchema,
  activate: z.boolean().optional(),
});

export const updatePublicOpinionSchema = z
  .object({
    question: question.optional(),
    status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
  })
  .refine((value) => value.question !== undefined || value.status !== undefined, {
    message: "At least one field is required.",
  });

export const votePublicOpinionSchema = z.object({
  optionId: z.string().trim().min(1, "optionId is required."),
});

export type CreatePublicOpinionInput = z.infer<typeof createPublicOpinionSchema>;
export type UpdatePublicOpinionInput = z.infer<typeof updatePublicOpinionSchema>;
export type VotePublicOpinionInput = z.infer<typeof votePublicOpinionSchema>;
