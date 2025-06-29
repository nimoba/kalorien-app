import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { Readable } from "stream";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { photoData, pose, timestamp } = req.body;

    if (!photoData || !pose) {
      return res.status(400).json({ error: 'Photo data and pose are required' });
    }

    // Get tokens from cookies
    const accessToken = req.cookies.google_access_token;
    const refreshToken = req.cookies.google_refresh_token;

    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    // Setup OAuth client with user's tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback`
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Convert base64 to stream
    const base64Data = photoData.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Create filename
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('de-DE').replace(/\./g, '-');
    const timeStr = date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }).replace(':', '-');
    const filename = `${dateStr}_${timeStr}_${pose}.jpg`;

    // Check/create Fortschrittsbilder folder in user's drive
    const folderQuery = "name='Fortschrittsbilder' and mimeType='application/vnd.google-apps.folder'";
    const folderSearch = await drive.files.list({
      q: folderQuery,
      fields: 'files(id, name)',
    });

    let folderId;
    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
    } else {
      // Create folder in user's drive
      const folderResponse = await drive.files.create({
        requestBody: {
          name: 'Fortschrittsbilder',
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = folderResponse.data.id;
    }

    // Upload to user's personal drive
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: filename,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: 'image/jpeg',
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    console.log(`✅ Upload zu persönlichem Drive erfolgreich: ${filename}`);

    res.status(200).json({
      success: true,
      fileId: uploadResponse.data.id,
      fileName: filename,
      webViewLink: uploadResponse.data.webViewLink,
    });

  } catch (error) {
    console.error("❌ OAuth Upload Fehler:", error);
    res.status(500).json({ 
      error: "Upload fehlgeschlagen",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}