import React from "react";
import dynamic from "next/dynamic";
import useInterval from "react-useinterval";
import { toast } from "react-toastify";
import { Button, Grid, Text } from "@chakra-ui/react";
import { isError } from "@/types";
import { useRecordsActions } from "./useStatus";
import { RecordStatus, isDDNSResponse, isStatusSnapshot } from "./types";
import { API_URL } from "@/constants";

const DynamicRecordTable = dynamic(() => import("./RecordTable"), {
  ssr: false,
});

type Status = {
  records: RecordStatus[];
};

export const Status = () => {
  const [syncing, setSyncing] = React.useState(false);
  const { saveStatusSnapshot } = useRecordsActions();

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/status`);
      const resJson = await res.json();

      if (isStatusSnapshot(resJson)) {
        saveStatusSnapshot(resJson);
      }
    } catch (err) {
      console.error("Unable to fetch ddns status", err);
    }
  };

  // Refetch status every minute
  useInterval(fetchStatus, 60 * 1000);

  // Fetch initial status
  React.useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = () => {
    setSyncing(true);
    fetch(`${API_URL}/ddns`, { method: "POST" })
      .then((res) => res.json())
      .then((res) => {
        if (isError(res)) {
          return toast.error(res.error);
        }

        if (isDDNSResponse(res)) {
          if (res.data !== null) saveStatusSnapshot(res.data);
        }
        return toast.success("DDNS synchronized");
      })
      .finally(() => setSyncing(false));
  };
  return (
    <>
      <Grid templateColumns={"1fr auto"}>
        <Text fontSize="xl">Status</Text>
        <Button onClick={handleSync} isLoading={syncing}>
          Sync
        </Button>
      </Grid>
      <DynamicRecordTable />
    </>
  );
};
