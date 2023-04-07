import React from "react";
import {
  Tr,
  Td,
  TableContainer,
  Table,
  Thead,
  Th,
  Tbody,
} from "@chakra-ui/react";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import { useConfig } from "../config/useConfig";
import { useRecord } from "./useRecords";
import { ExtendedRecord } from "./types";

export const RecordTableTimestamp = ({
  lastUpdated,
}: {
  lastUpdated?: number;
}) => {
  const [_, setTime] = React.useState(Date.now());

  React.useEffect(() => {
    // force a rerender every second so timestamp is updated
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {typeof lastUpdated === "number"
        ? `${formatDistanceToNowStrict(lastUpdated, {
            addSuffix: true,
          })}`
        : null}
    </>
  );
};

export const RecordTableItem = ({ name }: { name: string }) => {
  const record = useRecord(name);
  return (
    <Tr>
      <Td>
        <StatusIndicator status={record?.status} />
      </Td>
      <Td>{name}</Td>
      <Td>{record?.data}</Td>
      <Td>{record?.type}</Td>
      <Td>
        <RecordTableTimestamp lastUpdated={record?.lastUpdated} />
      </Td>
    </Tr>
  );
};

export const RecordTable = () => {
  const config = useConfig();
  if (config === null) return null;

  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th></Th>
            <Th>Name</Th>
            <Th>Data</Th>
            <Th>Type</Th>
            <Th>Updated</Th>
          </Tr>
        </Thead>
        <Tbody>
          {config.dynamicRecords.map((dr) => (
            <RecordTableItem name={dr.record} key={dr.record} />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default RecordTable;

const StatusIndicator = ({
  status,
}: {
  status: ExtendedRecord["status"] | undefined;
}) => {
  const getColor = () => {
    if (status === "synced") return "var(--chakra-colors-green-400)";
    if (status === "unknown") return "var(--chakra-colors-red-500)";
    return "var(--chakra-colors-whiteAlpha-400)";
  };
  return (
    <div
      style={{
        width: 8,
        height: 8,
        backgroundColor: getColor(),
        borderRadius: "50%",
      }}
    />
  );
};
