import mime from "mime";
import { getCDNCacheUrl } from "../routes/cdn-cache-url";
import { DbApi } from "@dobuki/data-client";
import { TokenResult } from "dok-auth";

export async function extractFile({
  file,
  githubApi,
  authResult,
  res,
  repo,
  owner,
  subfolder = "image"
}: {
  file?: Express.Multer.File;
  githubApi: DbApi;
  authResult: TokenResult;
  res: {
    status(status: number): any;
    send(data: any): any;
  };
  repo: string;
  owner: string;
  subfolder?: string;
}) {
  try {
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }
    // Get the image buffer from the file
    const { buffer, mimetype, originalname } = file;
    console.log(buffer, mimetype, originalname);
    const extension = originalname.split(".")[1] ?? mime.extension(mimetype);
    const filename = `${originalname.replace(/\.[^/.]+$/, '')}.${extension}`;
    // Convert the buffer to a Blob-like structure
    const saveResult = await githubApi.setData(
      `${subfolder}/${filename}`,
      new Blob([buffer], { type: mimetype })
    );
    const webUrl = `https://${owner}.github.io/${repo}/data/${subfolder}/${filename}`;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/data/${subfolder}/${filename}`;
    const cdnUrl = await getCDNCacheUrl(rawUrl);
    return res.send({
      message: 'Uploaded', ...authResult,
      url: cdnUrl ?? webUrl,
      backupUrl: !cdnUrl ? undefined : webUrl,
      saveResult,
      success: true,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error processing request.');
  }
}
