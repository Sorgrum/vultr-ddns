import storage from "node-persist";
import { Request, Response } from "express";
import { Router } from "express";

type ExtendedRecord = {
  id: string;
  type: string;
  name: string;
  data: string;
  priority: number;
  ttl: number;
  status: string;
  lastUpdated: number;
};

export type Status = {
  records: ExtendedRecord[];
};

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const status: unknown = await storage.getItem("status");
  return res.send(status);
});

export const saveStatus = (status: Status) => {
  return storage.setItem("status", status);
};

export const statusRouter = router;
