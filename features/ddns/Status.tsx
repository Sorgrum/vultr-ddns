import React from "react";
import dynamic from "next/dynamic";
import useInterval from "react-useinterval";
import { toast } from "react-toastify";
import { Button, Grid, Skeleton, Text } from "@chakra-ui/react";
import { isError } from "@/types";
import { useRecords, useRecordsActions } from "./useRecords";
import { RecordStatus, isDDNSResponse } from "./types";

const DynamicRecordTable = dynamic(() => import("./RecordTable"), {
  ssr: false,
});

type Status = {
  records: RecordStatus[];
};

const isStatus = (arg: unknown): arg is Status => {
  if (arg === null) return false;
  if (typeof arg !== "object") return false;
  if (!Object.hasOwn(arg, "records")) return false;
  return true;
};

export const Status = () => {
  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const { setRecords } = useRecordsActions();

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:5000/status");
      const resJson = await res.json();

      if (isStatus(resJson)) {
        setRecords(resJson.records);
      }
    } catch (err) {
      console.error("Unable to fetch ddns status", err);
    }
    setLoading(false);
  };

  // Refetch status every minute
  useInterval(fetchStatus, 60 * 1000);

  // Fetch initial status
  React.useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = () => {
    setSyncing(true);
    fetch("http://localhost:5000/ddns", { method: "POST" })
      .then((res) => res.json())
      .then((res) => {
        if (isError(res)) {
          return toast.error(res.error);
        }

        if (isDDNSResponse(res)) {
          if (res.data !== null) setRecords(res.data);
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
      <Skeleton isLoaded={!loading} speed={1.2}>
        <DynamicRecordTable />
      </Skeleton>
    </>
  );
};
