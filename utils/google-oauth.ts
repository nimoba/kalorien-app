import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import type { NextApiRequest, NextApiResponse } from "next";

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export async function getAuthenticatedClient(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<OAuth2Client | null> {
  try {
    const accessToken = req.cookies.google_access_token;
    const refreshToken = req.cookies.google_refresh_token;
    const expiryDate = req.cookies.google_token_expiry;

    // Must have at least a refresh token to proceed
    if (!refreshToken) {
      console.error("No refresh token found in cookies");
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback`
    );

    // Set initial credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate ? parseInt(expiryDate) : undefined,
    });

    // Check if we need to refresh the token
    const now = Date.now();
    const tokenExpiry = expiryDate ? parseInt(expiryDate) : 0;
    
    // Refresh if: no access token, no expiry date, or token is expired/expiring soon
    const needsRefresh = !accessToken || 
                        tokenExpiry === 0 || 
                        tokenExpiry < now + 60000; // 1 minute buffer

    if (needsRefresh) {
      console.log("Token refresh needed:", { 
        hasAccessToken: !!accessToken, 
        hasExpiry: tokenExpiry > 0,
        isExpired: tokenExpiry > 0 && tokenExpiry < now 
      });
      
      try {
        // Refresh the access token
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update cookies with new tokens
        const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
        const newCookies = [
          `google_access_token=${credentials.access_token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${thirtyDaysInSeconds}`,
        ];

        // Always keep the refresh token (use new one if provided, otherwise keep existing)
        const finalRefreshToken = credentials.refresh_token || refreshToken;
        newCookies.push(
          `google_refresh_token=${finalRefreshToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${thirtyDaysInSeconds}`
        );

        if (credentials.expiry_date) {
          newCookies.push(
            `google_token_expiry=${credentials.expiry_date}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${thirtyDaysInSeconds}`
          );
        }

        res.setHeader('Set-Cookie', newCookies);
        
        // Update the client with new credentials
        oauth2Client.setCredentials(credentials);
        
        console.log("Access token refreshed successfully");
      } catch (refreshError) {
        console.error("Failed to refresh access token:", refreshError);
        
        // Clear invalid tokens
        res.setHeader('Set-Cookie', [
          'google_access_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
          'google_refresh_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
          'google_token_expiry=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
          'user_email=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
        ]);
        
        return null;
      }
    }

    return oauth2Client;
  } catch (error) {
    console.error("Error setting up OAuth client:", error);
    return null;
  }
}

export function handleAuthError(res: NextApiResponse, message: string = "Authentication required") {
  // Clear invalid tokens
  res.setHeader('Set-Cookie', [
    'google_access_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'google_refresh_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0', 
    'google_token_expiry=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'user_email=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
  ]);
  
  return res.status(401).json({ 
    error: message,
    requiresAuth: true 
  });
}