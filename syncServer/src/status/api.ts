import storage from "node-persist";
import { Request, Response } from "express";
import { Router } from "express";
import { getStatusSnapshot } from "./status";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const status = await getStatusSnapshot();
  return res.send(status);
});

export const statusRouter = router;
