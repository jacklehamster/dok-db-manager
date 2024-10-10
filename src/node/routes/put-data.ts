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
}

export function addPutDataRoute(app: express.Express, { githubApi, auth, owner, repo }: Props) {
  function cleanData(data: Record<string, any>) {
    for (let key in data) {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
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
    }

    const result = await githubApi.setData(path, (data: any) => cleanData({
      ...data.data,
      ...(body.data ?? {}),
    }), setDataOptions);

    return res.json({ ...result, ...authResult });
  });

  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
  }); // Configure multer to save files to the 'uploads' directory

  const TYPES = ["image", "audio", "video"];

  TYPES.forEach((type) => {
    app.post(`/upload/${type}`, upload.single(type), async (req, res) => {
      // Access the uploaded file
      const file = req.file;
      if (!file) {
        return res.status(400).send('No file uploaded.');
      }

      const requestProps = unpackRequest(req);
      const authResult = await auth.authenticatePayload(requestProps);
      if (!authResult.authToken) {
        return res.json({ success: false, message: "Unauthorized", authResult });
      }
      await extractFile({
        file: req.file,
        repo,
        owner,
        githubApi,
        authResult,
        res,
        subfolder: type,
        requestProps,
      })
    });
  });
}
