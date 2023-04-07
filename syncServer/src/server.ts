import { Request, Response } from "express";
import { ScheduledTask } from "node-cron";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import storage from "node-persist";
import ddnsRoutes from "./ddns/api";
import { isLocalConfig, LocalConfig } from "features/config/types";
import { statusRouter } from "./status/api";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const initiateSync = () => {
  console.log("initiating sync");
  fetch("http://localhost:5000/ddns", { method: "POST" })
    .then((res) => res.json())
    .then(console.log)
    .catch((err) => console.error("Error syncing ddns", err));
};

let task: ScheduledTask | null = null;

const defaultConfig: LocalConfig = {
  apiKey: "",
  domain: "",
  dynamicRecords: [],
  interval: 5,
};

(async () => {
  await storage.init(/* options ... */);
  const config: unknown = await storage.getItem("config");
  if (isLocalConfig(config)) {
    console.log(
      "Setting up initial task on saved interval",
      `*/${config.interval} * * * *`
    );
    task = cron.schedule(`*/${config.interval} * * * *`, initiateSync);
  } else {
    console.log(
      "Setting up initial task using default interval",
      `*/5 * * * *`
    );
    task = cron.schedule(`*/5 * * * *`, initiateSync);
    const res = await storage.setItem("config", defaultConfig);
    console.debug("startup", res, isLocalConfig(defaultConfig), defaultConfig);
  }
})();

app.post("/config", async (req: Request, res: Response) => {
  try {
    if (!isLocalConfig(req.body.config)) {
      return res.status(200).json({
        error: "Config doesn't match schema",
        data: null,
      });
    }
    const config = req.body.config;
    await storage.setItem("config", config);
    task?.stop(); // Stop task if running
    task = cron.schedule(`*/${config.interval} * * * *`, initiateSync);
    return res.status(200).json({ data: config, error: null });
  } catch (err) {
    console.error("POST /config error", err);
    return res
      .status(200)
      .json({ data: null, error: "Unable to save configuration" });
  }
});

app.get("/config", async (req: Request, res: Response) => {
  try {
    const config: unknown = await storage.getItem("config");

    if (!isLocalConfig(config)) {
      await storage.setItem("config", defaultConfig);
      console.debug("Invalid saved config, using default");
      return res.status(200).json({ data: defaultConfig, error: null });
    }

    return res.status(200).json({ data: config, error: null });
  } catch (err) {
    console.error("GET /config error", err);
    return res
      .status(200)
      .json({ data: null, error: "Unable to load configuration " });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("hello");
});

app.use("/ddns", ddnsRoutes);
app.use("/status", statusRouter);

export default app;