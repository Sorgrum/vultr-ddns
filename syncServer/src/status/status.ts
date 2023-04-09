import {
  StatusSnapshot,
  statusSnapshotSchema,
} from "../../../features/ddns/types";
import storage from "node-persist";

const EMPTY_STATUS_SNAPSHOT: StatusSnapshot = {
  records: [],
  lastUpdated: null,
};

export const getStatusSnapshot = async (): Promise<StatusSnapshot> => {
  const savedStatus = await storage.getItem("status");
  const parsedStatus = statusSnapshotSchema.safeParse(savedStatus);
  if (parsedStatus.success) return parsedStatus.data;
  return EMPTY_STATUS_SNAPSHOT;
};

export const saveStatusSnapshot = (snapshot: unknown) => {
  const parsedStatus = statusSnapshotSchema.safeParse(snapshot);
  if (parsedStatus.success) {
    return storage.setItem("status", parsedStatus.data);
  }
  return storage.setItem("status", EMPTY_STATUS_SNAPSHOT);
};
