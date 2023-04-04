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
import { formatDistanceToNow } from "date-fns";
import { useConfig } from "../config/useConfig";
import { useRecord } from "./useRecords";

export const RecordTableTimestamp = ({
  lastUpdated,
}: {
  lastUpdated?: number;
}) => {
  const [time, setTime] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {typeof lastUpdated === "number"
        ? `${formatDistanceToNow(lastUpdated)} ago`
        : null}
    </>
  );
};

export const RecordTableItem = ({ name }: { name: string }) => {
  const record = useRecord(name);
  return (
    <Tr>
      <Td>
        <StatusIndicator active={record?.status === "synced"} />
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

const StatusIndicator = ({ active }: { active?: boolean }) => {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        backgroundColor: active ? "green" : "red",
        borderRadius: "50%",
      }}
    />
  );
};
