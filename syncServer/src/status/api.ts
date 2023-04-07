import storage from "node-persist";
import { Request, Response } from "express";
import { Router } from "express";
import { RecordStatus } from "features/ddns/types";

export type StatusSnapshot = {
  records: RecordStatus[];
};

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const status: unknown = await storage.getItem("status");
  return res.send(status);
});

export const saveStatus = (status: StatusSnapshot) => {
  return storage.setItem("status", status);
};

export const statusRouter = router;
