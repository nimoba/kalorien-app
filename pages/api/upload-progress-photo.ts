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

    // Google Drive Auth
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Convert base64 to buffer and create readable stream
    const base64Data = photoData.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create readable stream from buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Create filename with timestamp and pose
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('de-DE').replace(/\./g, '-');
    const timeStr = date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }).replace(':', '-');
    
    const filename = `${dateStr}_${timeStr}_${pose}.jpg`;

    // Check if "Fortschrittsbilder" folder exists, create if not
    const folderQuery = "name='Fortschrittsbilder' and mimeType='application/vnd.google-apps.folder'";
    const folderSearch = await drive.files.list({
      q: folderQuery,
      fields: 'files(id, name)',
    });

    let folderId;
    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
    } else {
      // Create folder
      const folderResponse = await drive.files.create({
        requestBody: {
          name: 'Fortschrittsbilder',
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = folderResponse.data.id;
    }

    // Upload photo to Drive using resumable upload
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

    console.log(`✅ Fortschrittsfoto hochgeladen: ${filename}`);

    // Also save metadata to spreadsheet for tracking
    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Fortschrittsbilder!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            dateStr,
            timeStr,
            pose,
            filename,
            uploadResponse.data.id || ''
          ]],
        },
      });
    } catch (sheetError) {
      console.warn("⚠️ Konnte Metadaten nicht in Sheet speichern:", sheetError);
      // Don't fail the whole request if sheet fails
    }

    res.status(200).json({
      success: true,
      fileId: uploadResponse.data.id,
      fileName: filename,
      webViewLink: uploadResponse.data.webViewLink,
    });

  } catch (error) {
    console.error("❌ Fehler beim Upload:", error);
    res.status(500).json({ 
      error: "Foto konnte nicht hochgeladen werden",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}