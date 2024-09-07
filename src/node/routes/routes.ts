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

export interface Config {
  redisConfig?: RedisWrapConfig;
  github: {
    owner: string;
    repo: string;
  };
  newgrounds?: {
    game?: string;
    url?: string;
    key: string;
    skey: string;
  };
  secret?: {
    secret: string;
  };
  nocache?: boolean;
  nolock?: boolean;
}

export function addRoutes(app: express.Express, config: Config) {
  app.use(express.json());

  const redisClient = createRedisClient(config.redisConfig);
  const githubDb = getGithubDb({
    lock: config.nolock ? undefined : new RedisLock(redisClient),
    owner: config.github.owner,
    repo: config.github.repo,
  })
  const githubApi = config.nocache ? githubDb : new CacheWrap(redisClient, githubDb);

  const auth = new AuthManager(
    new AuthProvider(redisClient),
    [
      config.newgrounds ? new NewgroundsAuthenticator({
        game: config.newgrounds?.game,
        url: config.newgrounds?.url,
        key: config.newgrounds.key,
        skey: process.env.NEWGROUND_SKEY!,
      }) : null,
      config.secret ? new SecretAuthenticator({
        secretWord: config.secret.secret,
      }) : null,
    ].filter(a => a),
  );

  addSaveImageRoute(app, { githubApi, auth, owner: config.github.owner, repo: config.github.repo });
  addListRoute(app, { githubApi });
  addGetDataRoute(app, { githubApi, owner: config.github.owner, repo: config.github.repo });
  addPutDataRoute(app, { githubApi, auth });
}