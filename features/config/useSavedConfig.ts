import { isConfigResponse } from "@/pages/api/config";
import React from "react";
import { toast } from "react-toastify";
import { VultrConfigSchema } from "./types";

type Props = {
  onConfigUpdate?: (config: VultrConfigSchema) => void;
};
export const useSavedConfig = (props?: Props) => {
  const [loading, setLoading] = React.useState(true);
  const [config, setConfig] = React.useState<VultrConfigSchema | null>(null);

  const refetch = async () => {
    setLoading(true);
    fetch("/api/config")
      .then((res) => res.json())
      .then((res) => {
        if (isConfigResponse(res)) {
          if (res.error !== null) return toast.error(res.error);
          setConfig(res.data);
          if (res.data !== null) props?.onConfigUpdate?.(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Unable to connect to API");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const save = async (config: VultrConfigSchema) => {
    return fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    })
      .catch((err) => {
        console.error(err);
        toast.error("Unable to save config");
      })
      .finally(refetch);
  };

  React.useEffect(() => {
    refetch();
  }, []);

  return { config, loading, refetch, save };
};
