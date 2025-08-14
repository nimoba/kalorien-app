import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { getAuthenticatedClient, handleAuthError } from "../../utils/google-oauth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated OAuth client with automatic token refresh
    const oauth2Client = await getAuthenticatedClient(req, res);
    
    if (!oauth2Client) {
      return handleAuthError(res, 'Authentication failed. Please login again.');
    }

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
      error: 'Failed to fetch photos from Google Drive',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
}