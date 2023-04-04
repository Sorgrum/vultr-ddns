import React from "react";
import { toast } from "react-toastify";
import { Button, Grid, Text } from "@chakra-ui/react";
import { isError } from "@/types";

export const Status = () => {
  const [loading, setLoading] = React.useState(false);
  const handleSync = () => {
    setLoading(true);
    fetch("/api/ddns")
      .then((res) => res.json())
      .then((res) => {
        if (isError(res)) {
          return toast.error(res.error);
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
    </>
  );
};
