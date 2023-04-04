import React from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { Button, Grid, Text } from "@chakra-ui/react";
import { isError } from "@/types";
import { useRecordsActions } from "./useRecords";
import { isDDNSResponse } from "@/pages/api/ddns";

const DynamicRecordTable = dynamic(() => import("./RecordTable"), {
  ssr: false,
});

export const Status = () => {
  const [loading, setLoading] = React.useState(false);
  const { setRecords } = useRecordsActions();

  const handleSync = () => {
    setLoading(true);
    fetch("/api/ddns")
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
      .finally(() => setLoading(false));
  };
  return (
    <>
      <Grid templateColumns={"1fr auto"}>
        <Text fontSize="xl">Status</Text>
        <Button onClick={handleSync} isLoading={loading}>
          Sync
        </Button>
      </Grid>
      <DynamicRecordTable />
    </>
  );
};
