import express from "express";
import { DbApi } from "@dobuki/data-client";
import { AuthManager } from "dok-auth";
import { SetDataOptions } from "@the-brains/github-db";

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
}

export function addPutDataRoute(app: express.Express, { githubApi, auth }: Props) {
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
}
