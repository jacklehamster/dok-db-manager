import express from "express";
import { DbApi } from "@dobuki/data-client";
import { AuthManager } from "dok-auth";
import { SetDataOptions } from "@the-brains/github-db";
import multer from "multer";
import { extractFile } from "../file-upload/upload-utils";
import { unpackRequest } from "./request";

interface DataQuery {
  user?: string;
  token?: string;
  session?: string;
  secret?: string;
  branch?: string;
}

interface BodyQuery {
  data?: Record<string, any>;
}

interface Props {
  githubApi: DbApi;
  auth: AuthManager;
  owner: string;
  repo: string;
  moderator?: (imageUrl: string) => Promise<boolean>;
}

export function addPutDataRoute(app: express.Express, { githubApi, auth, owner, repo }: Props) {
  function cleanData(data: Record<string, any>) {
    for (let key in data) {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
      } else if (typeof data[key] === "object") {
        data[key] = cleanData(data[key]);
      } else if (typeof data[key] === "string") {
        data[key] = data[key].split("/").map((a) => a.split(" ").map(encodeURIComponent).join(" ")).join("/");
      }
    }
    return data;
  }

  app.put("/data/*", async (req, res) => {
    const path = (req.params as string[])[0];
    const query = req.query as DataQuery;
    const body = req.body as BodyQuery;

    const requestProps = unpackRequest(req);
    const authResult = await auth.authenticatePayload(requestProps);
    if (!authResult.authToken) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const setDataOptions: SetDataOptions = {
      branch: query.branch ?? "main",
      externalUsername: requestProps.userId,
      repo: {
        name: requestProps.repo?.name ?? repo,
        owner: requestProps.repo?.owner ?? owner,
      },
    }

    const result = await githubApi.setData(path, !body.data ? null : typeof (body.data) === "string" ? body.data : (data: any) => ({
      ...data.data,
      ...cleanData({ ...(body.data ?? {}) }),
    }), setDataOptions);

    return res.json({ ...result, ...authResult, success: true });
  });
}

export function addUploadRoute(app: express.Express, { githubApi, auth, owner, repo, moderator }: Props) {
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
  }); // Configure multer to save files to the 'uploads' directory

  const TYPES = ["image", "audio", "video", "bin"];

  TYPES.forEach((type) => {
    app.post(`/upload/${type}`, upload.single(type), async (req, res) => {
      const file = req.file;
      if (!file) {
        return res.status(400).send('No file uploaded.');
      }

      const requestProps = unpackRequest(req);
      const authResult = await auth.authenticatePayload(requestProps);
      if (!authResult.authToken) {
        return res.json({ success: false, message: "Unauthorized", authResult });
      }
      const dir = `${type === "bin" ? "" : `${type}/`}${requestProps?.group ? `${requestProps.group}` : ""}`;

      await extractFile({
        file: req.file,
        repo: {
          name: requestProps.repo?.name ?? repo,
          owner: requestProps.repo?.owner ?? owner,
        },
        githubApi,
        authResult,
        res,
        dir,
        externalUsername: requestProps?.userId ? `${requestProps?.type}-${requestProps?.userId}` : undefined,
        moderator: type === "image" ? moderator : undefined,
      })
    });
  });
}
