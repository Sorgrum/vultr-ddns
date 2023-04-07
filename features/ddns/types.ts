import { z } from "zod";

/**
 * Sample Record:
 *
 * {
 *   "id": "4e40bb43-cfbe-4a57-8d49-5259eb3feba5",
 *   "type": "NS",
 *   "name": "",
 *   "data": "ns1.vultr.com",
 *   "priority": -1,
 *   "ttl": 300
 * },
 */
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

export const extendedRecordSchema = recordSchema.extend({
  id: z.string().optional(),
  priority: z.number().optional(),
  ttl: z.number().optional(),
  status: z.union([z.literal("synced"), z.literal("unknown")]),
  lastUpdated: z.number(),
});
export type RecordStatus = z.infer<typeof extendedRecordSchema>;

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

export type DDNSResponse = {
  error: string | null;
  data: RecordStatus[] | null;
};

export const isDDNSResponse = (msg: unknown): msg is DDNSResponse => {
  if (typeof msg !== "object") return false;
  if (msg === null) return false;
  if (!Object.prototype.hasOwnProperty.call(msg, "error")) return false;
  if (!Object.prototype.hasOwnProperty.call(msg, "data")) return false;
  return true;
};
