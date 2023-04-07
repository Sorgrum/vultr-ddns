import {
  DDNSResponse,
  RecordStatus,
  LocalRecord,
  Record,
  recordSchema,
} from "features/ddns/types";
import { isConfigResponse, LocalConfig } from "features/config/types";
import { isError } from "types";
import { Request, Response, Router } from "express";
import { getRecordsToChange } from "./records";
import { saveStatus } from "../status/api";
import { record, z } from "zod";
import type { SetRequired } from "type-fest";

const getPublicIPv4 = async (): Promise<string | null> => {
  try {
    const res = await fetch("https://ip4.seeip.org");
    const addr = await res.text();
    return addr;
  } catch (err) {
    return null;
  }
};

const getPublicIPv6 = async (): Promise<string | null> => {
  try {
    const res = await fetch("https://ip6.seeip.org", {
      signal: AbortSignal.timeout(10000),
    });
    const addr = await res.text();
    return addr;
  } catch (err) {
    return null;
  }
};

export type CreateRecord = SetRequired<
  Partial<Record>,
  "name" | "type" | "data"
>;
const createRecordResponseSchema = z.object({
  record: recordSchema,
});
type CreateRecordResponse = z.infer<typeof createRecordResponseSchema>;

const isCreateRecordResponse = (res: unknown): res is CreateRecordResponse => {
  const parsed = createRecordResponseSchema.safeParse(res);
  return parsed.success;
};

export const createRecord = async (
  record: CreateRecord,
  config: LocalConfig
): Promise<Record> => {
  try {
    const res = await fetch(
      `https://api.vultr.com/v2/domains/${config.domain}/records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(record),
      }
    );

    const resJson = await res.json();
    console.log("create res", resJson, isCreateRecordResponse(resJson));
    if (isError(resJson)) throw new Error(resJson.error);
    if (isCreateRecordResponse(resJson)) return resJson.record;
    throw new Error(`Unable to create record. Name: ${record.name}`);
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
    throw new Error(`Unable to create record. Name: ${record.name}`);
  }
};

export const patchRecord = async (
  record: LocalRecord,
  config: LocalConfig
): Promise<LocalRecord> => {
  try {
    const res = await fetch(
      `https://api.vultr.com/v2/domains/${config.domain}/records/${record.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ data: record.newIp }),
      }
    );

    const resJson = await res.json();
    if (isError(resJson)) throw new Error(resJson.error);
    return record;
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
    throw new Error(
      `Unable to update record id: ${record.id}, name: ${record.name}`
    );
  }
};

export const synchronizeDDNS = async (
  config: LocalConfig
): Promise<RecordStatus[]> => {
  const ipv4: string | null = await getPublicIPv4();
  const ipv6: string | null = await getPublicIPv6();

  console.debug("ip addresses, ipv4:", ipv4, ", ipv6:", ipv6);

  if (ipv4 === null) throw new Error("Unable to retrieve IPv4 address");

  const ipv4Records = await getRecordsToChange("A", ipv4, config);
  const ipv6Records: Awaited<ReturnType<typeof getRecordsToChange>> =
    ipv6 === null
      ? { checked: [], change: [], create: [] }
      : await getRecordsToChange("AAAA", ipv6, config);

  console.debug("records, ipv4: ", ipv4Records, ", ipv6:", ipv6Records);

  if (ipv4Records.checked.length === 0 && ipv6Records.checked.length === 0)
    throw new Error(
      "No matching records to synchronize found. Dynamic records must exist in Vultr DNS records."
    );

  if (ipv4Records.change.length === 0 && ipv6Records.change.length === 0) {
    console.debug("no changed records");
  }

  const settledIPv4Changes = await Promise.allSettled(
    ipv4Records.change.map((record) => patchRecord(record, config))
  );
  const settledIPv6Changes = await Promise.allSettled(
    ipv6Records.change.map((record) => patchRecord(record, config))
  );
  const settledIPv4Creates = await Promise.allSettled(
    ipv4Records.create.map((record) => createRecord(record, config))
  );
  const settledIPv6Creates = await Promise.allSettled(
    ipv6Records.create.map((record) => createRecord(record, config))
  );

  const fulfilledIPv4Changes = settledIPv4Changes
    .filter(
      (res): res is PromiseFulfilledResult<LocalRecord> =>
        res.status === "fulfilled"
    )
    .map((res) => res.value);

  const fulfilledIPv6Changes = settledIPv6Changes
    .filter(
      (res): res is PromiseFulfilledResult<LocalRecord> =>
        res.status === "fulfilled"
    )
    .map((res) => res.value);

  const fulfilledIPv4Creates = settledIPv4Creates
    .filter(
      (res): res is PromiseFulfilledResult<Record> => res.status === "fulfilled"
    )
    .map((res) => res.value);

  const fulfilledIPv6Creates = settledIPv6Creates
    .filter(
      (res): res is PromiseFulfilledResult<Record> => res.status === "fulfilled"
    )
    .map((res) => res.value);

  return [
    ...ipv4Records.checked.map((record) => ({
      ...record,
      status: record.data === ipv4 ? ("synced" as const) : ("unknown" as const),
      lastUpdated: Date.now(),
    })),
    ...ipv6Records.checked.map((record) => ({
      ...record,
      status: record.data === ipv6 ? ("synced" as const) : ("unknown" as const),
      lastUpdated: Date.now(),
    })),
    ...ipv4Records.change.map((record) => {
      const isFulfilled = fulfilledIPv4Changes.some(
        (fullfilled) => fullfilled.id === record.id
      );
      return {
        ...record,
        status: isFulfilled ? ("synced" as const) : ("unknown" as const),
        data: isFulfilled ? record.newIp : record.data,
        lastUpdated: Date.now(),
      };
    }),
    ...ipv6Records.change.map((record) => {
      const isFulfilled = fulfilledIPv6Changes.some(
        (fullfilled) => fullfilled.id === record.id
      );
      return {
        ...record,
        status: isFulfilled ? ("synced" as const) : ("unknown" as const),
        data: isFulfilled ? record.newIp : record.data,
        lastUpdated: Date.now(),
      };
    }),
    ...ipv4Records.create.map((record) => {
      const fullfilled = fulfilledIPv4Creates.find(
        (fullfilled) => fullfilled.id === record.id
      );
      const isFulfilled = fullfilled !== undefined;
      return {
        ...record,
        status: isFulfilled ? ("synced" as const) : ("unknown" as const),
        lastUpdated: Date.now(),
      };
    }),
    ...ipv4Records.create.map((record) => {
      const fullfilled = fulfilledIPv6Creates.find(
        (fullfilled) => fullfilled.id === record.id
      );
      const isFulfilled = fullfilled !== undefined;
      return {
        ...record,
        status: isFulfilled ? ("synced" as const) : ("unknown" as const),
        lastUpdated: Date.now(),
      };
    }),
  ];
};

const fetchConfig = async (): Promise<LocalConfig> => {
  const res = await fetch("http://localhost:5000/config");
  const resJson = await res.json();
  if (!isConfigResponse(resJson))
    throw new Error("Unable to retrieve configuration");
  if (resJson.data === null)
    throw new Error("Unable to retrieve configuration");
  return resJson.data;
};

const storeStatus = async (records: RecordStatus[]) => {
  return fetch("http://localhost:5000/status", {
    method: "POST",
    body: JSON.stringify({ records }),
  });
};

const router = Router();

router.post("/", async (req: Request, res: Response<DDNSResponse>) => {
  console.debug("/api/ddns");
  try {
    const config = await fetchConfig();
    const records: RecordStatus[] = await synchronizeDDNS(config);
    await saveStatus({ records });
    return res.status(200).json({ data: records, error: null });
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      return res.status(200).json({ data: null, error: err.message });
    }
    return res.status(200).json({ data: null, error: "Unknown error" });
  }
});

export default router;
