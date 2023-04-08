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

export const recordStatusSchema = recordSchema.extend({
  id: z.string().optional(),
  priority: z.number().optional(),
  ttl: z.number().optional(),
  lastUpdated: z.number().optional(),
});
export type RecordStatus = z.infer<typeof recordStatusSchema>;

export const statusSnapshotSchema = z.object({
  records: recordStatusSchema.array(),
  lastUpdated: z.number().nullable(),
});
export type StatusSnapshot = z.infer<typeof statusSnapshotSchema>;

export const isStatusSnapshot = (arg: unknown): arg is StatusSnapshot => {
  return statusSnapshotSchema.safeParse(arg).success;
};

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

export const ddnsResponseSchema = z.object({
  error: z.string().nullable(),
  data: statusSnapshotSchema.nullable(),
});
export type DDNSResponse = z.infer<typeof ddnsResponseSchema>;

export const isDDNSResponse = (msg: unknown): msg is DDNSResponse => {
  return ddnsResponseSchema.safeParse(msg).success;
};
