import { LocalConfig, vultrConfigToLocalConfig } from "@/features/config/types";
import { getRecordsToChange, LocalRecord } from "@/features/ddns/records";
import { NextApiRequest, NextApiResponse } from "next";
import { isError } from "@/types";
import { isConfigResponse } from "./config";

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

    const resJson = res.json();
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
): Promise<PromiseSettledResult<LocalRecord>[]> => {
  const ipv4: string | null = await getPublicIPv4();
  const ipv6: string | null = await getPublicIPv6();

  console.debug("ip addresses, ipv4:", ipv4, ", ipv6:", ipv6);

  if (ipv4 === null) throw new Error("Unable to retrieve IPv4 address");

  const ipv4Records = await getRecordsToChange("A", ipv4, config);
  const ipv6Records =
    ipv6 === null
      ? { checked: [], change: [] }
      : await getRecordsToChange("AAAA", ipv6, config);

  console.debug("records, ipv4: ", ipv4Records, ", ipv6:", ipv6Records);

  if (ipv4Records.checked.length === 0 && ipv6Records.checked.length === 0)
    throw new Error("Configuration error, no records to change.");

  if (ipv4Records.change.length === 0 && ipv6Records.change.length === 0) {
    console.debug("no changed records");
    return [];
  }

  return await Promise.allSettled([
    ...ipv4Records.change.map((record) => patchRecord(record, config)),
    ...ipv6Records.change.map((record) => patchRecord(record, config)),
  ]);
};

const fetchConfig = async (): Promise<LocalConfig> => {
  const res = await fetch("http://localhost:3000/api/config");
  const resJson = await res.json();
  if (!isConfigResponse(resJson))
    throw new Error("Unable to retrieve configuration");
  if (resJson.data === null)
    throw new Error("Unable to retrieve configuration");
  return vultrConfigToLocalConfig(resJson.data);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const config = await fetchConfig();
    const result = await synchronizeDDNS(config);
    console.log("result", result);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(200).json({ error: err.message });
    }
    return res.status(200).json({ error: "Unknown error" });
  }
}
