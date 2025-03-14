import { DbApi } from "@dobuki/data-client";
import express from "express";

interface Props {
  githubApi: DbApi;
}

export function addListRoute(app: express.Express, { githubApi }: Props) {
  app.get("/list", async (req, res): Promise<any> => {
    const subfolder = req.query.subfolder?.toString();
    const branch = req.query.branch?.toString();
    const recursive = req.query.recursive !== "false";
    return res.json(await githubApi.listKeys(subfolder, branch, recursive));
  });
}
