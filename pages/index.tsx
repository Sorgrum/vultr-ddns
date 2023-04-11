import React from "react";
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { ConfigForm } from "@/features/config/ConfigForm";
import { Status } from "@/features/ddns/Status";
import dynamic from "next/dynamic";

const DynamicConfigForm = dynamic(
  () => import("../features/config/ConfigForm"),
  {
    ssr: false,
  }
);

const DynamicStatus = dynamic(() => import("../features/ddns/Status"), {
  ssr: false,
});

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
          <DynamicConfigForm />
          <DynamicStatus />
        </div>
      </main>
    </>
  );
}
