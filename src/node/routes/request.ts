import { Request } from "express";

interface AuthenticationQuery {
  user?: string;
  token?: string;
  session?: string;
  secret?: string;
  type?: string;
  key?: string;
}

export interface RequestProps {
  userId?: string;
  authToken?: string;
  session?: string;
  secret?: string;
  type?: string;
  key?: string;
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
  };
}