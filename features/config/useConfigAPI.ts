import React from "react";
import { toast } from "react-toastify";
import { isConfigResponse } from "@/pages/api/config";
import { LocalConfig } from "./types";
import { isError } from "@/types";
import { useConfigActions } from "./useConfig";

type Props = {
  onConfigUpdate?: (config: LocalConfig) => void;
};
export const useConfigAPI = (props?: Props) => {
  const [loading, setLoading] = React.useState(false);
  const { setConfig } = useConfigActions();

  const fetchConfig = () =>
    fetch("/api/config")
      .then((res) => res.json())
      .then((res) => {
        if (isConfigResponse(res)) {
          if (res.error !== null) return toast.error(res.error);
          setConfig(res.data);
          if (res.data !== null) props?.onConfigUpdate?.(res.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });

  const refetch = async () => {
    setLoading(true);
    fetchConfig().catch((err) => {
      console.error(err);
      toast.error("Unable to connect to API");
    });
  };

  const save = async (config: LocalConfig) => {
    return fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (isError(res)) toast.error(res.error);
      })
      .catch((err) => {
        console.error(err);
        if (err instanceof Error) {
          return toast.error(err.message);
        }
        toast.error("Unable to save config");
      })
      .finally(refetch);
  };

  return { loading, refetch, save };
};
