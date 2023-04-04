import Head from "next/head";
import { useFieldArray, useForm } from "react-hook-form";
import styles from "@/styles/Home.module.css";
import React from "react";
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Box,
  IconButton,
  Text,
  Flex,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeleteIcon } from "@chakra-ui/icons";
import {
  LocalConfig,
  localConfigSchema,
  VultrConfig,
} from "@/features/config/types";
import { toast } from "react-toastify";
import { isConfigResponse } from "./api/config";
import { ConfigForm } from "@/features/config/ConfigForm";
import { isError } from "@/types";

export default function Home() {
  return (
    <>
      <Head>
        <title>Vultr DDNS</title>
        <meta name="description" content="DDNS for Vultr" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.grid}>
          <ConfigForm />
        </div>
      </main>
    </>
  );
}
