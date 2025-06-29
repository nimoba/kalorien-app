import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback`
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store tokens in cookie (in production, use secure storage)
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60; // 30 Tage

    res.setHeader('Set-Cookie', [
      `google_access_token=${tokens.access_token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${thirtyDaysInSeconds}`,
      `google_refresh_token=${tokens.refresh_token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${thirtyDaysInSeconds}`,
      `user_email=${userInfo.data.email}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${thirtyDaysInSeconds}`
    ]);

    // Redirect back to fortschritt page
    res.redirect('/fortschritt?auth=success');
  } catch (error) {
    console.error("OAuth callback failed:", error);
    res.redirect('/fortschritt?auth=error');
  }
}