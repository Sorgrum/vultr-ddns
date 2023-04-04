import { z } from "zod";

export const localConfigSchema = z.object({
  apiKey: z.string().length(36),
  domain: z.string().min(1),
  dynamicRecords: z.array(z.object({ record: z.string() })),
});
export type LocalConfig = z.infer<typeof localConfigSchema>;
