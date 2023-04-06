import { z } from "zod";

export const localConfigSchema = z.object({
  apiKey: z.string(),
  domain: z.string(),
  dynamicRecords: z.array(z.object({ record: z.string() })),
  interval: z.coerce.number(),
});
export const validateConfigSchema = localConfigSchema.extend({
  apiKey: z.string().length(36),
  domain: z.string().min(1),
});
export type LocalConfig = z.infer<typeof localConfigSchema>;

export const isLocalConfig = (config: unknown): config is LocalConfig => {
  const parsed = localConfigSchema.safeParse(config);
  return parsed.success;
};

export type ConfigResponse = {
  error: string | null;
  data: LocalConfig | null;
};

export const isConfigResponse = (msg: unknown): msg is ConfigResponse => {
  if (typeof msg !== "object") return false;
  if (msg === null) return false;
  if (!Object.hasOwn(msg, "error")) return false;
  if (!Object.hasOwn(msg, "data")) return false;
  return true;
};
