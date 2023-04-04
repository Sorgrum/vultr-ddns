import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { ExtendedRecord } from "./records";

type RecordEntities = { [id: string]: ExtendedRecord };

interface RecordsState {
  records: RecordEntities;
  names: string[];
  setRecords: (records: ExtendedRecord[]) => void;
}

const useRecords = create<RecordsState>()(
  devtools(
    persist(
      (set) => ({
        records: {},
        names: [],
        setRecords: (records) => {
          const entities: RecordEntities = {};
          const names: string[] = [];
          records.forEach((record) => {
            names.push(record.name);
            entities[record.name] = record;
          });
          set({
            records: entities,
            names,
          });
        },
      }),
      {
        name: "records",
      }
    )
  )
);

export const useRecordsActions = () =>
  useRecords((state) => ({
    setRecords: state.setRecords,
  }));

export const useRecordNames = () => useRecords((state) => state.names);

export const useRecord = (name: string): ExtendedRecord | undefined =>
  useRecords((state) => state.records[name]);
