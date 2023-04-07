import { isError } from "../../../types";
import {
  LocalRecord,
  Record,
  recordsResponseSchema,
} from "features/ddns/types";

import { LocalConfig } from "../../../features/config/types";
import { CreateRecord } from "./api";

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
): Promise<{
  checked: Record[];
  change: LocalRecord[];
  create: CreateRecord[];
}> => {
  const records = await getRecords(config);
  console.debug("all records:", records);

  const toCheck: Record[] = [];

  records.forEach((record) => {
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

  const recordNames = records.map((r) => r.name);

  const toCreate: CreateRecord[] = [];
  config.dynamicRecords.forEach(({ record: recordName }) => {
    if (!recordNames.includes(recordName)) {
      toCreate.push({
        name: recordName,
        data: ip,
        type: recordType,
      });
    }
  });

  return { checked: toCheck, change: toChange, create: toCreate };
};
