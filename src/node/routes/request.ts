import { Request } from "express";

interface AuthenticationQuery {
  user?: string;
  token?: string;
  session?: string;
  secret?: string;
  type?: string;
  key?: string;
  repoName?: string;
  repoOwner?: string;
  group?: string;
  domain?: string;
}

export interface RequestProps {
  userId?: string;
  authToken?: string;
  session?: string;
  secret?: string;
  type?: string;
  key?: string;
  repo?: {
    owner: string;
    name: string;
  }
  group?: string;
  domain?: string;
}

export function unpackRequest(req: Request): RequestProps {
  const query = req.query as AuthenticationQuery;
  return {
    userId: query.user ?? req.body.user,
    authToken: query.token ?? req.body.token,
    session: query.session ?? req.body.session,
    secret: query.secret ?? req.body.secret,
    type: query.type ?? req.body.type,
    key: query.key ?? req.body.key,
    repo: query.repoName && query.repoOwner ? {
      owner: query.repoOwner,
      name: query.repoName
    } : undefined,
    group: query.group ?? req.body.group,
    domain: query.domain ?? req.body.domain,
  };
}
