import { Request, Response } from "express";
import { ScheduledTask } from "node-cron";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import storage from "node-persist";
import ddnsRoutes, { initiateSync } from "./ddns/api";
import {
  ConfigResponse,
  isLocalConfig,
  LocalConfig,
} from "../../features/config/types";
import { statusRouter } from "./status/api";

const app = express();

app.use(cors());

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    console.debug(
      "Setting up initial task on saved interval",
      `*/${config.interval} * * * *`
    );
    task = cron.schedule(`*/${config.interval} * * * *`, initiateSync);
  } else {
    console.debug(
      "Setting up initial task using default interval",
      `*/5 * * * *`
    );
    task = cron.schedule(`*/5 * * * *`, initiateSync);
    await storage.setItem("config", defaultConfig);
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

export const getConfig = async (): Promise<LocalConfig> => {
  const config: unknown = await storage.getItem("config");

  if (!isLocalConfig(config)) {
    await storage.setItem("config", defaultConfig);
    console.debug("Invalid saved config, using default");
    return defaultConfig;
  }

  return config;
};

app.get("/config", async (req: Request, res: Response) => {
  try {
    const config: unknown = await getConfig();
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
