import mime from "mime";
import { getCDNCacheUrl } from "../routes/cdn-cache-url";
import { DbApi } from "@dobuki/data-client";
import { TokenResult } from "dok-auth";
import { RequestProps } from "../routes/request";
import { SetDataOptions } from "@the-brains/github-db";

export async function extractFile({
  file,
  githubApi,
  authResult,
  res,
  repo,
  owner,
  subfolder = "image",
  requestProps,
  domain,
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
  requestProps?: RequestProps;
  domain?: string;
}) {
  try {
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }
    // Get the image buffer from the file
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const { buffer, mimetype, originalname } = file;
    const extension = originalname.split(".").pop() ?? mime.extension(mimetype);
    const filename = `${encodeURIComponent(originalname.replace(/\.[^/.]+$/, ''))}.${extension}`;
    // console.log(buffer, mimetype, filename);
    // Convert the buffer to a Blob-like structure
    const options: SetDataOptions = {
      externalUsername: requestProps?.userId ? `${requestProps?.type}-${requestProps?.userId}` : undefined,
      repo: requestProps?.repo ?? undefined,
    };
    const path = `${subfolder}${requestProps?.group ? `/${requestProps.group}` : ""}/${filename}`;
    const saveResult = await githubApi.setData(path, new Blob([buffer], { type: mimetype }), options);
    const webDomain = domain ?? `https://${requestProps?.repo?.owner ?? owner}.github.io/${requestProps?.repo?.name ?? repo}`;
    const webUrl = `${webDomain.startsWith("http") ? webDomain : `https://${webDomain}`}/data/${path}`;
    const rawUrl = `https://raw.githubusercontent.com/${requestProps?.repo?.owner ?? owner}/${requestProps?.repo?.name ?? repo}/refs/heads/main/data/${path}`;
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
