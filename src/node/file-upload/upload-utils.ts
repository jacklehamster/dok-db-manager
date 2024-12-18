import mime from "mime";
import { getCDNCacheUrl, getHomepageUrl } from "../routes/cdn-cache-url";
import { DbApi } from "@dobuki/data-client";
import { TokenResult } from "dok-auth";
import { SetDataOptions } from "@the-brains/github-db";

export async function extractFile({
  file,
  githubApi,
  authResult,
  res,
  repo,
  externalUsername,
  dir,
  moderator,
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
  moderator?: (imageUrl: string) => Promise<boolean>;
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

    const path = `${dir ? `${dir}/` : ""}${filename}`;
    const saveResult = await githubApi.setData(path, new Blob([buffer], { type: mimetype }), options);

    // check if we can grab the domain from github api
    const [cdnUrl, webDomain] = await Promise.all([
      getCDNCacheUrl(`https://raw.githubusercontent.com/${repo.owner}/${repo.name}/refs/heads/main/data/${path}`),
      getHomepageUrl(repo.owner, repo.name).then((url) => url ?? `https://${repo.owner}.github.io/${repo.name}`),
    ]);
    if (cdnUrl && moderator && !await moderator(cdnUrl)) {
      return res.status(403).send('Forbidden');
    }

    const webUrl = `${webDomain.startsWith("http") ? webDomain : `https://${webDomain}`}${webDomain.endsWith("/") ? "" : "/"}data/${path}`;
    return res.send({
      message: 'Uploaded', ...authResult,
      path,
      url: cdnUrl ?? webUrl,
      backupUrl: !cdnUrl ? undefined : webUrl,
      saveResult,
      success: !!saveResult.sha,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error processing request.');
  }
}
