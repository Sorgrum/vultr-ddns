import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { LocalConfig } from "./types";

interface ConfigState {
  config: LocalConfig | null;
  setConfig: (config: LocalConfig | null) => void;
}

const useConfigStore = create<ConfigState>()(
  devtools(
    persist(
      (set) => ({
        config: null,
        setConfig: (config) => {
          set({ config });
        },
      }),
      {
        name: "records",
      }
    )
  )
);

export const useConfigActions = () =>
  useConfigStore((state) => ({
    setConfig: state.setConfig,
  }));

export const useConfig = () => useConfigStore((state) => state.config);
