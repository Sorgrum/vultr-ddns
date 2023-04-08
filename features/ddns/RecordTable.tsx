import React from "react";
import {
  Tr,
  Td,
  TableContainer,
  Table,
  Thead,
  Th,
  Tbody,
  TableCaption,
  Skeleton,
} from "@chakra-ui/react";
import { formatDistanceToNowStrict } from "date-fns";
import { useConfig } from "../config/useConfig";
import { useStatus, useStatusLastUpdated } from "./useStatus";

export const LastUpdated = ({
  timestamp,
  prefix,
}: {
  timestamp: number | null | undefined;
  prefix?: boolean;
}) => {
  const [_, setTime] = React.useState(Date.now());

  React.useEffect(() => {
    // force a rerender every second so timestamp is updated
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const getPrefix = () => {
    if (prefix) return "Last updated ";
    return "";
  };

  return (
    <>
      {getPrefix()}
      {typeof timestamp === "number"
        ? `${formatDistanceToNowStrict(timestamp, {
            addSuffix: true,
          })}`
        : null}
    </>
  );
};

export const StatusSkeleton = ({ children }: React.PropsWithChildren) => {
  const lastUpdated = useStatusLastUpdated();
  if (lastUpdated === null)
    return (
      <Skeleton
        height="20px"
        speed={1.4}
        startColor="gray.200"
        endColor="gray.500"
      />
    );
  return <>{children}</>;
};

export const RecordTableItem = ({ name }: { name: string }) => {
  const lastUpdated = useStatusLastUpdated();

  const record = useStatus(name);
  console.log("name", name, record);
  return (
    <Tr>
      <Td>
        <StatusIndicator
          active={lastUpdated === null ? undefined : record !== undefined}
        />
      </Td>
      <Td>
        <StatusSkeleton>{name}</StatusSkeleton>
      </Td>
      <Td>
        <StatusSkeleton>{record?.data}</StatusSkeleton>
      </Td>
      <Td>
        <StatusSkeleton>{record?.type}</StatusSkeleton>
      </Td>
      <Td>
        <StatusSkeleton>
          <LastUpdated timestamp={record?.lastUpdated} />
        </StatusSkeleton>
      </Td>
    </Tr>
  );
};

export const RecordTable = () => {
  const lastUpdated = useStatusLastUpdated();

  const config = useConfig();
  if (config === null) return null;

  return (
    <TableContainer>
      <Table variant="simple">
        <TableCaption>
          <LastUpdated timestamp={lastUpdated} prefix />
        </TableCaption>
        <Thead>
          <Tr>
            <Th></Th>
            <Th>Name</Th>
            <Th>Data</Th>
            <Th>Type</Th>
            <Th>Last Updated</Th>
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

const StatusIndicator = ({ active }: { active: boolean | undefined }) => {
  const getColor = () => {
    if (active === undefined) return "var(--chakra-colors-whiteAlpha-400";
    if (active) return "var(--chakra-colors-green-400)";
    return "var(--chakra-colors-red-500)";
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
