import express from "express";
import { AuthManager, AuthProvider, NewgroundsAuthenticator, SecretAuthenticator } from "dok-auth";
import { CacheWrap, createRedisClient } from "@dobuki/data-client";
import { getGithubDb } from "../github/getGithub";
import { RedisLock } from "@dobuki/code-lock";
import { addSaveImageRoute } from "./save-image";
import { addListRoute } from "./list";
import { addGetDataRoute } from "./get-data";
import { addPutDataRoute } from "./put-data";
import { RedisWrapConfig } from "@dobuki/data-client/dist/redis/redis-wrap";
import dotenv from "dotenv";

dotenv.config();

export interface Config {
  redisConfig?: RedisWrapConfig;
  github: {
    owner: string;
    repo: string;
  };
  newgrounds?: {
    key: string;
    skey: string;
  }[];
  secret?: {
    secret: string;
  };
  nocache?: boolean;
  nolock?: boolean;
}

export function addRoutes(app: express.Express, config: Config) {
  app.use(express.json());

  const redisClient = config.redisConfig ? createRedisClient(config.redisConfig) : null;
  const githubDb = getGithubDb({
    lock: config.nolock || !redisClient ? undefined : new RedisLock(redisClient),
    owner: config.github.owner,
    repo: config.github.repo,
  })
  const githubApi = config.nocache ? githubDb : new CacheWrap(redisClient, githubDb);

  const authData: Record<string, any> = {};

  const newgroundsConfigs = config.newgrounds ?? [];
  if (process.env.NEWGROUNDS_SKEY && process.env.NEWGROUNDS_KEY) {
    newgroundsConfigs.push({
      key: process.env.NEWGROUNDS_KEY,
      skey: process.env.NEWGROUNDS_SKEY,
    });
  }

  const auth = new AuthManager(
    new AuthProvider(redisClient ?? {
      get: async (key) => (authData[key], null),
      set: async (key, value) => authData[key] = value,
      del: async (key) => (delete authData[key], 0),
      quit: async () => "",
    }),
    [
      newgroundsConfigs.length ? new NewgroundsAuthenticator(newgroundsConfigs.map(({ key, skey }) => ({
        key: key,
        skey: skey,
      }))) : null,
      config.secret ? new SecretAuthenticator({
        secretWord: config.secret.secret,
      }) : null,
    ].filter(a => a),
  );

  addSaveImageRoute(app, { githubApi, auth, owner: config.github.owner, repo: config.github.repo });
  addListRoute(app, { githubApi });
  addGetDataRoute(app, { githubApi, owner: config.github.owner, repo: config.github.repo });
  addPutDataRoute(app, { githubApi, auth, owner: config.github.owner, repo: config.github.repo });
}
