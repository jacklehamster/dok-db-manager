import express from "express";
import { DbApi } from "@dobuki/data-client";
import { AuthManager } from "dok-auth";
import { SetDataOptions } from "@the-brains/github-db";
import multer from "multer";
import { extractFile } from "../file-upload/upload-utils";

interface DataQuery {
  user?: string;
  token?: string;
  session?: string;
  secret?: string;
  branch?: string;
}

interface BodyQuery {
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
    const authResult = await auth.authenticatePayload({
      userId: query.user,
      authToken: query.token,
      session: query.session,
      secret: query.secret,
    });
    if (!authResult.authToken) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const setDataOptions: SetDataOptions = {
      branch: query.branch ?? "main",
      externalUsername: query.user,
    }

    const result = await githubApi.setData(path, (data: any) => cleanData({
      ...data.data,
      ...(body ?? {}),
    }), setDataOptions);

    return res.json({ ...result, ...authResult });
  });

  const storage = multer.memoryStorage();
  const upload = multer({ storage }); // Configure multer to save files to the 'uploads' directory

  const TYPES = ["image", "audio", "video"];

  TYPES.forEach((type) => {
    app.post(`/upload/${type}`, upload.single(type), async (req, res) => {
      // Access the uploaded file
      const file = req.file;
      if (!file) {
        return res.status(400).send('No file uploaded.');
      }

      const query = req.query as {
        user: string;
        token?: string;
        session?: string;
        secret?: string;
      };
      const authResult = await auth.authenticatePayload({
        userId: query.user,
        authToken: query.token,
        session: query.session,
        secret: req.body.secret,
      });
      if (!authResult.authToken) {
        return res.json({ success: false, message: "Unauthorized", authResult });
      }
      extractFile({
        file: req.file,
        repo,
        owner,
        githubApi,
        authResult,
        res,
      })
    });
  });
}
