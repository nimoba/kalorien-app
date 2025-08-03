import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // First, find or create the Fortschrittsbilder folder (same as upload API)
    const folderQuery = "name='Fortschrittsbilder' and mimeType='application/vnd.google-apps.folder' and trashed=false";
    const folderResponse = await drive.files.list({
      q: folderQuery,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (!folderResponse.data.files || folderResponse.data.files.length === 0) {
      return res.status(200).json({ photos: [] });
    }

    const folderId = folderResponse.data.files[0].id;

    // Get all photos from the folder
    const photosResponse = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
      fields: 'files(id, name, createdTime, webContentLink, thumbnailLink)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });

    if (!photosResponse.data.files) {
      return res.status(200).json({ photos: [] });
    }

    // Process photos and extract metadata from filename
    const photos = await Promise.all(photosResponse.data.files.map(async (file) => {
      try {
        // Parse pose from filename (e.g., "31-12-2024_23-59-59_vorn.jpg")
        const match = file.name?.match(/_(\w+)\.(jpg|jpeg|png)$/);
        const pose = match ? match[1] : 'unknown';
        
        // Get the actual image data
        const response = await drive.files.get({
          fileId: file.id!,
          alt: 'media'
        }, {
          responseType: 'arraybuffer'
        });

        const base64 = Buffer.from(response.data as ArrayBuffer).toString('base64');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return {
          id: file.id,
          pose: pose as 'vorn' | 'seite' | 'hinten',
          dataUrl,
          timestamp: file.createdTime,
          name: file.name
        };
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return null;
      }
    }));

    // Filter out any failed downloads
    const validPhotos = photos.filter(photo => photo !== null);

    res.status(200).json({ photos: validPhotos });
  } catch (error) {
    console.error('Error fetching photos from Google Drive:', error);
    res.status(500).json({ 
      error: 'Failed to fetch photos from Google Drive',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}