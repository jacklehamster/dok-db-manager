import mime from "mime";
import { getCDNCacheUrl, getHomepageUrl } from "../routes/cdn-cache-url";
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
  externalUsername,
  dir,
}: {
  file?: Express.Multer.File;
  githubApi: DbApi;
  authResult: TokenResult;
  res: {
    status(status: number): any;
    send(data: any): any;
  };
  repo: {
    name: string;
    owner: string;
  };
  externalUsername?: string;
  dir: string;
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
      externalUsername,
      repo,
    };
    const path = `${dir}/${filename}`;
    const saveResult = await githubApi.setData(path, new Blob([buffer], { type: mimetype }), options);
    // check if we can grab the domain from github api
    const [cdnUrl, webDomain] = await Promise.all([
      getCDNCacheUrl(`https://raw.githubusercontent.com/${repo.owner}/${repo.name}/refs/heads/main/data/${path}`),
      getHomepageUrl(repo.owner, repo.name).then((url) => url ?? `https://${repo.owner}.github.io/${repo.name}`),
    ]);

    const webUrl = `${webDomain.startsWith("http") ? webDomain : `https://${webDomain}`}/data/${path}`;
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
