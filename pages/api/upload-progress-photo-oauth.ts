import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { Readable } from "stream";
import { getAuthenticatedClient, handleAuthError } from "../../utils/google-oauth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Upload API called with pose:', req.body?.pose);

  try {
    const { photoData, pose, timestamp } = req.body;

    if (!photoData || !pose) {
      console.error('Missing required data:', { hasPhotoData: !!photoData, hasPose: !!pose });
      return res.status(400).json({ error: 'Photo data and pose are required' });
    }

    console.log('Getting authenticated OAuth client...');
    // Get authenticated OAuth client with automatic token refresh
    const oauth2Client = await getAuthenticatedClient(req, res);
    
    if (!oauth2Client) {
      console.error('Failed to get authenticated OAuth client');
      return handleAuthError(res, 'Authentication failed. Please login again.');
    }
    
    console.log('OAuth client obtained successfully');

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
    console.log('Searching for Fortschrittsbilder folder...');
    const folderQuery = "name='Fortschrittsbilder' and mimeType='application/vnd.google-apps.folder'";
    const folderSearch = await drive.files.list({
      q: folderQuery,
      fields: 'files(id, name)',
    });

    let folderId;
    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
      console.log('Found existing folder with ID:', folderId);
    } else {
      console.log('Creating new Fortschrittsbilder folder...');
      // Create folder in user's drive
      const folderResponse = await drive.files.create({
        requestBody: {
          name: 'Fortschrittsbilder',
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = folderResponse.data.id;
      console.log('Created new folder with ID:', folderId);
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
    
    // Check for various auth/permission errors
    const errorMessage = error instanceof Error ? error.message : '';
    
    if (errorMessage.includes('invalid_grant') || 
        errorMessage.includes('Token has been expired or revoked')) {
      return handleAuthError(res, 'Google authentication expired. Please login again.');
    }
    
    if (errorMessage.includes('Insufficient Permission') || 
        errorMessage.includes('insufficient authentication scopes')) {
      // Need to re-authenticate with proper permissions
      return handleAuthError(res, 'Insufficient permissions. Please re-authorize the app with Google Drive access.');
    }
    
    res.status(500).json({ 
      error: "Upload fehlgeschlagen",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
}