import { vultrConfigSchema, VultrConfigSchema } from "@/features/config/types";
import type { NextApiRequest, NextApiResponse } from "next";
import { readFile, readdir, readFileSync, writeFileSync } from "fs";
import path from "path";

export type ConfigResponse = {
  error: string | null;
  data: VultrConfigSchema | null;
};

export const isConfigResponse = (msg: unknown): msg is ConfigResponse => {
  if (typeof msg !== "object") return false;
  if (msg === null) return false;
  if (!Object.hasOwn(msg, "error")) return false;
  if (!Object.hasOwn(msg, "data")) return false;
  return true;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfigResponse>
) {
  const configPath = path.join("data/config.json");

  if (req.method === "GET") {
    try {
      const configJson = readFileSync(configPath, { encoding: "utf8" });
      try {
        const config = JSON.parse(configJson);

        const parsedConfig = vultrConfigSchema.parse(config);

        return res.status(200).json({
          error: null,
          data: parsedConfig,
        });
      } catch (err) {
        return res.status(200).json({
          error: "Invalid saved config",
          data: null,
        });
      }
    } catch (err) {
      return res.status(200).json({
        error: "Unable to load config file",
        data: null,
      });
    }
  } else if (req.method === "POST") {
    const config = req.body.config;
    try {
      const parsedConfig = vultrConfigSchema.parse(config);

      writeFileSync(configPath, JSON.stringify(parsedConfig));
      setTimeout(() => {
        return res.status(200).json({
          error: null,
          data: parsedConfig,
        });
      }, 2000);
    } catch (err) {
      return res.status(200).json({
        error: "Invalid config",
        data: null,
      });
    }
  }
}
