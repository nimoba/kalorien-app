import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback`
    );

    // Check if user already has a refresh token
    const existingRefreshToken = req.cookies?.google_refresh_token;
    
    // Generate OAuth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      // Use 'consent' for first-time auth to ensure we get refresh token
      // Use 'select_account' for re-auth if we already have a refresh token
      prompt: existingRefreshToken ? 'select_account' : 'consent'
    });

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error("OAuth URL generation failed:", error);
    res.status(500).json({ error: "OAuth setup failed" });
  }
}