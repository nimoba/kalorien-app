import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const message = req.body?.message || "Kein Inhalt";
  console.log("📥 CLIENT LOG:", message);
  res.status(200).json({ status: "ok" });
}
