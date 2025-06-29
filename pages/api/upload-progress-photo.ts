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

    // Simple Drive Auth - just for file upload
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

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

    // Direct upload to your shared folder - NO folder creation, NO searching
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: filename,
        parents: ["1SFH6gk4XH4s6KdCsPDQL1575LBXIo2CZ"], // Your shared folder ID
      },
      media: {
        mimeType: 'image/jpeg',
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    console.log(`✅ Upload erfolgreich: ${filename}`);

    res.status(200).json({
      success: true,
      fileId: uploadResponse.data.id,
      fileName: filename,
      webViewLink: uploadResponse.data.webViewLink,
    });

  } catch (error) {
    console.error("❌ Upload Fehler:", error);
    res.status(500).json({ 
      error: "Upload fehlgeschlagen",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}