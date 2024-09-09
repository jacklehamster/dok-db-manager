import { DbApi } from "@dobuki/data-client";
import { GithubApi } from "@the-brains/github-db";
import { Lock, lockWrap } from "@dobuki/code-lock";

interface Props {
  owner: string;
  repo: string;
  lock?: Lock;
}

export function getGithubDb(props: Props): DbApi {
  const githubApi = new GithubApi({
    username: props.owner,
    organizationName: props.owner,
    databaseStorageRepoName: props.repo,
    authToken: process.env.GITHUBDB_TOKEN ?? "",
  });
  return props.lock ? {
    ...lockWrap(githubApi, props.lock),
  } : githubApi;
}
