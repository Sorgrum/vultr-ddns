import to from "await-to-js";
import { LocalError, isError } from "@/types";
import { z } from "zod";

import { LocalConfig } from "../config/types";

export const recordSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  data: z.string(),
  priority: z.number(),
  ttl: z.number(),
});
export type Record = z.infer<typeof recordSchema>;

export const localRecordSchema = recordSchema.extend({
  newIp: z.string(),
});
export type LocalRecord = z.infer<typeof localRecordSchema>;

export const recordsResponseSchema = z.object({
  records: z.array(recordSchema),
  meta: z.object({
    total: z.number(),
    links: z.object({
      next: z.string(),
      prev: z.string(),
    }),
  }),
});
export type RecordsResponse = z.infer<typeof recordsResponseSchema>;

export const getRecords = async (config: LocalConfig): Promise<Record[]> => {
  const res = await fetch(
    `https://api.vultr.com/v2/domains/${config.domain}/records?per_page=500`,
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    }
  );

  const resJson = await res.json();
  if (isError(resJson)) {
    if (resJson.error.includes("is not authorized")) {
      throw new Error(
        "You are not authorized to use the API. If using IPv6, or an IPv6 address is displayed below, you need to go to your account API settings and click Allow all IPv6."
      );
    }
    throw new Error(resJson.error);
  }

  const resParsed = recordsResponseSchema.safeParse(resJson);
  if (!resParsed.success) throw new Error("Invalid response from Vultr API");

  return resParsed.data.records;
};

export const getRecordsToChange = async (
  recordType: "A" | "AAAA",
  ip: string,
  config: LocalConfig
): Promise<{ checked: Record[]; change: LocalRecord[] }> => {
  const records = await getRecords(config);
  console.debug("all records:", records);

  const toCheck: Record[] = [];

  records.forEach((record) => {
    console.log("record,", record, "dynamicRecords,", config.dynamicRecords);
    if (
      record.type === recordType &&
      config.dynamicRecords.some((dr) => dr.record === record.name)
    ) {
      toCheck.push(record);
    }
  });

  const toChange: LocalRecord[] = toCheck
    .filter((record) => record.data !== ip)
    .map((record) => ({
      ...record,
      newIp: ip,
    }));

  return { checked: toCheck, change: toChange };
};
