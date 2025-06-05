// pages/api/auth.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;
  const correctPassword = process.env.PASSWORD || "fallback123";

  console.log("Server: Eingegeben:", password);
  console.log("Server: Erwartet:", correctPassword);

  if (password === correctPassword) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
}