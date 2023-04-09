import {
  DDNSResponse,
  RecordStatus,
  LocalRecord,
  Record,
  recordSchema,
  StatusSnapshot,
} from "../../../features/ddns/types";
import { isConfigResponse, LocalConfig } from "../../../features/config/types";
import { isError } from "../../../types";
import { Request, Response, Router } from "express";
import { getRecordsToChange } from "./records";
import { getStatusSnapshot, saveStatusSnapshot } from "../status/status";
import { z } from "zod";
import type { SetRequired } from "type-fest";
import storage from "node-persist";

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
    await fetch(
      `https://api.vultr.com/v2/domains/${config.domain}/records/${record.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ data: record.newIp }),
      }
    );
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
  const ipv6Records = await getRecordsToChange("AAAA", ipv6, config);

  console.debug("records, ipv4: ", ipv4Records, ", ipv6:", ipv6Records);

  const onlyFulfilled = <T>(
    res: PromiseRejectedResult | PromiseFulfilledResult<T>
  ): res is PromiseFulfilledResult<T> => res.status === "fulfilled";

  const unwrap = <T>(res: PromiseFulfilledResult<T>): T => res.value;

  const setLastUpdated = (rec: RecordStatus): RecordStatus => ({
    ...rec,
    lastUpdated: Date.now(),
  });

  const settled = [
    ...(await Promise.allSettled(
      ipv4Records.change.map((record) => patchRecord(record, config))
    )),
    ...(await Promise.allSettled(
      ipv6Records.change.map((record) => patchRecord(record, config))
    )),
    ...(await Promise.allSettled(
      ipv4Records.create.map((record) => createRecord(record, config))
    )),
    ...(await Promise.allSettled(
      ipv6Records.create.map((record) => createRecord(record, config))
    )),
  ];

  const modifiedRecordsStatuses: RecordStatus[] = settled
    .filter(onlyFulfilled)
    .map(unwrap)
    .map(setLastUpdated);

  const statusSnapshot = await getStatusSnapshot();

  const allRecords: RecordStatus[] = [];
  config.dynamicRecords.forEach(({ record }) => {
    const modified = modifiedRecordsStatuses.find((r) => r.name === record);
    if (modified !== undefined) return allRecords.push(modified);
    const saved = statusSnapshot.records.find((r) => r.name === record);
    if (saved !== undefined) return allRecords.push(saved);
  });

  return allRecords;
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

const router = Router();

router.post("/", async (req: Request, res: Response<DDNSResponse>) => {
  console.debug("/api/ddns");
  try {
    const config = await fetchConfig();
    const records: RecordStatus[] = await synchronizeDDNS(config);
    const snapshot: StatusSnapshot = { records, lastUpdated: Date.now() };
    await saveStatusSnapshot(snapshot);
    return res.status(200).json({ data: snapshot, error: null });
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      return res.status(200).json({ data: null, error: err.message });
    }
    return res.status(200).json({ data: null, error: "Unknown error" });
  }
});

export default router;
