import { z } from "zod";

export const vultrConfigSchema = z.object({
  api_key: z.string().length(36),
  domain: z.string().min(1),
  dynamic_records: z.array(z.string()),
});
export type VultrConfigSchema = z.infer<typeof vultrConfigSchema>;

export const localConfigSchema = z.object({
  apiKey: z.string().length(36),
  domain: z.string().min(1),
  dynamicRecords: z.array(z.object({ record: z.string() })),
});
export type LocalConfigSchema = z.infer<typeof localConfigSchema>;

export const vultrConfigToLocalConfig = (
  vultrConfig: VultrConfigSchema
): LocalConfigSchema => ({
  apiKey: vultrConfig.api_key,
  domain: vultrConfig.domain,
  dynamicRecords: vultrConfig.dynamic_records.map((record) => ({ record })),
});

export const localConfigToVultrConfig = (
  localConfig: LocalConfigSchema
): VultrConfigSchema => ({
  api_key: localConfig.apiKey,
  domain: localConfig.domain,
  dynamic_records: localConfig.dynamicRecords.map((r) => r.record),
});
