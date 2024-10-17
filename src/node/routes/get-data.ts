import { DbApi } from "@dobuki/data-client";
import express from "express";
import { getCDNCacheUrl } from "./cdn-cache-url";

interface Props {
  owner: string;
  repo: string;
  githubApi: DbApi;
}

export function addGetDataRoute(app: express.Express, { githubApi, owner, repo }: Props) {
  function uncleanData(data: Record<string, any>) {
    for (let key in data) {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
      } else if (typeof data[key] === "object") {
        data[key] = uncleanData(data[key]);
      } else if (typeof data[key] === "string") {
        data[key] = decodeURIComponent(data[key]);
      }

    }
    return data;
  }


  app.get("/data/*", async (req, res) => {
    const path = (req.params as string[])[0];
    const data = uncleanData(await githubApi.getData(path));
    const rawUrl = data.url;
    const webUrl = `https://${owner}.github.io/${repo}/data/${path}`;
    const cdnUrl = rawUrl ? await getCDNCacheUrl(rawUrl) : null;
    if (data.type === "blob") {
      return res.json({
        type: data.type,
        sha: data.sha,
        size: data.size,
        url: cdnUrl ?? webUrl,
        backupUrl: !cdnUrl ? undefined : webUrl,
      });
    } else if (data.type === "object") {
      return res.json({
        type: data.type,
        data: data.data,
        sha: data.sha,
        url: cdnUrl ?? webUrl,
        backupUrl: !cdnUrl ? undefined : webUrl,
      });
    }
  });
}
