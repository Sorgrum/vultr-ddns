import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { LocalConfig, localConfigSchema } from "@/features/config/types";

export type ConfigResponse = {
  error: string | null;
  data: LocalConfig | null;
};

export const isConfigResponse = (msg: unknown): msg is ConfigResponse => {
  if (typeof msg !== "object") return false;
  if (msg === null) return false;
  if (!Object.hasOwn(msg, "error")) return false;
  if (!Object.hasOwn(msg, "data")) return false;
  return true;
};

const configPath = path.join("app-data/config.json");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfigResponse>
) {
  if (req.method === "GET") {
    try {
      if (!existsSync(configPath))
        return res.status(200).json({
          error: null,
          data: null,
        });
      const configJson = readFileSync(configPath, { encoding: "utf8" });
      const config = JSON.parse(configJson);

      const parsedConfig = localConfigSchema.safeParse(config);

      if (!parsedConfig.success) {
        return res.status(200).json({
          error: "Saved config doesn't match schema",
          data: null,
        });
      }

      return res.status(200).json({
        error: null,
        data: parsedConfig.data,
      });
    } catch (err) {
      return res.status(200).json({
        error: "Unable to load config file",
        data: null,
      });
    }
  } else if (req.method === "POST") {
    const config = req.body.config;
    try {
      const parsedConfig = localConfigSchema.safeParse(config);
      if (!parsedConfig.success) {
        return res.status(200).json({
          error: "Config doesn't match schema",
          data: null,
        });
      }
      writeFileSync(configPath, JSON.stringify(parsedConfig.data));

      const timeout = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
      };
      await timeout(2000);
      return res.status(200).json({
        error: null,
        data: parsedConfig.data,
      });
    } catch (err) {
      console.error(err);
      return res.status(200).json({
        error: "Invalid config",
        data: null,
      });
    }
  }
}
