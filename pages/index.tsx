import React from "react";
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { ConfigForm } from "@/features/config/ConfigForm";
import { Status } from "@/features/ddns/Status";

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
          <Status />
        </div>
      </main>
    </>
  );
}
