import storage from "node-persist";
import { Request, Response } from "express";
import { Router } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const status: unknown = await storage.getItem("status");
  return res.send(status);
});

export const statusRouter = router;
