import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = req.cookies.google_access_token;
    const userEmail = req.cookies.user_email;

    res.status(200).json({
      authenticated: !!accessToken,
      email: userEmail || null
    });
  } catch (error) {
    res.status(200).json({
      authenticated: false,
      email: null
    });
  }
}