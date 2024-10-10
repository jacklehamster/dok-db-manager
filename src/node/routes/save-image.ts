import express from "express";
import multer from "multer";
import mime from "mime-types";
import { DbApi } from "@dobuki/data-client";
import { AuthManager } from "dok-auth";
import { unpackRequest } from "./request";

interface Props {
  owner: string;
  repo: string;
  githubApi: DbApi;
  auth: AuthManager;
}

export function addSaveImageRoute(app: express.Express, { githubApi, auth, owner, repo }: Props) {
  // Configure multer for file storage
  const storage = multer.memoryStorage();

  const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (_req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/svg'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type.'));
      }
      cb(null, true);
    }
  });

  // Convert buffer to stream (helper function)

  // Route to handle image upload and save
  app.post('/save-image', upload.single('image'), async (req, res) => {
    const requestProps = unpackRequest(req);
    const authResult = await auth.authenticatePayload(requestProps);
    if (!authResult.authToken) {
      return res.json({ success: false, message: "Unauthorized", authResult });
    }
    try {
      if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }
      // Get the image buffer from the file
      const { buffer, mimetype, originalname } = req.file;
      const filename = originalname.replace(/\.[^/.]+$/, '');
      // Convert the buffer to a Blob-like structure
      const saveResult = await githubApi.setData(
        `image/${filename}.${mime.extension(mimetype)}`,
        new Blob([buffer], { type: mimetype }),
        {
          externalUsername: `${requestProps.type}-${requestProps.userId}`,
        }
      );
      return res.send({
        message: 'Uploaded', ...authResult,
        url: `https://${owner}.github.io/${repo}/data/image/${filename}.${mime.extension(mimetype)}`,
        saveResult,
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).send('Error processing request.');
    }
  });

}
