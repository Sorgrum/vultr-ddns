import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { RecordStatus, StatusSnapshot } from "./types";

type StatusEntities = { [id: string]: RecordStatus };

interface StatusState {
  statuses: StatusEntities;
  recordNames: string[];
  lastUpdated: number | null;
  saveStatusSnapshot: (snapshot: StatusSnapshot) => void;
}

export const useStatusState = create<StatusState>()(
  devtools(
    (set) => ({
      statuses: {},
      recordNames: [],
      lastUpdated: null,
      saveStatusSnapshot: (snapshot) => {
        const entities: StatusEntities = {};
        const names: string[] = [];
        console.log("saveStatusSnapshot", snapshot);
        snapshot.records.forEach((record) => {
          names.push(record.name);
          entities[record.name] = record;
        });
        set({
          statuses: entities,
          recordNames: names,
          lastUpdated: snapshot.lastUpdated,
        });
      },
    }),
    {
      name: "records",
    }
  )
);

export const useRecordsActions = () =>
  useStatusState((state) => ({
    saveStatusSnapshot: state.saveStatusSnapshot,
  }));

export const useStatusRecordNames = () =>
  useStatusState((state) => state.recordNames);

export const useStatus = (name: string): RecordStatus | undefined =>
  useStatusState((state) => state.statuses[name]);

export const useStatusLastUpdated = () =>
  useStatusState((state) => state.lastUpdated);
