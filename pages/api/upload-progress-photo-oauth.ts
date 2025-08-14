import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { Readable } from "stream";
import { getAuthenticatedClient, handleAuthError } from "../../utils/google-oauth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { photoData, pose, timestamp } = req.body;

    if (!photoData || !pose) {
      return res.status(400).json({ error: 'Photo data and pose are required' });
    }

    // Get authenticated OAuth client with automatic token refresh
    const oauth2Client = await getAuthenticatedClient(req, res);
    
    if (!oauth2Client) {
      return handleAuthError(res, 'Authentication failed. Please login again.');
    }

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
    
    // Check if it's an auth error
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return handleAuthError(res, 'Google authentication expired. Please login again.');
    }
    
    res.status(500).json({ 
      error: "Upload fehlgeschlagen",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
}