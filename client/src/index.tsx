import type { DbApi } from "@dobuki/data-client";

interface Props {
  rootUrl: string;
  user: string;
  type: string;
  session: string;
  secret?: string;
  key?: string;
}

export class DokDb implements DbApi {
  rootUrl: string;
  user: string;
  token?: string;
  session?: string;
  secret?: string;
  type: string;
  key?: string;

  constructor({ rootUrl, user, type, session, secret, key }: Props) {
    this.rootUrl = rootUrl;
    this.user = user;
    this.type = type;
    this.session = session;
    this.secret = secret;
    this.key = key;
  }

  async listKeys(subfolder?: string, branch?: string, recursive?: boolean): Promise<any> {
    const params = new URLSearchParams();
    if (subfolder) {
      params.set("subfolder", subfolder);
    }
    if (branch) {
      params.set("branch", branch);
    }
    if (recursive === false) {
      params.set("recursive", "false");
    }
    const url = `${this.rootUrl}/list${params.size ? "?" + params.toString() : ""}`;
    const response = await fetch(url);
    return response.json();
  }

  async getData(key: string): Promise<{ data: any; type?: string | null; sha: string | null; }> {
    const response = await fetch(`${this.rootUrl}/data/${key}`);
    return response.json() as Promise<{ data: any; type?: string | null; sha: string | null; }>;
  }

  async setData(key: string, valueOrCall: any): Promise<any> {
    let value;
    if (typeof (valueOrCall) === "function") {
      const data = await this.getData(key);
      value = await valueOrCall(data.data, data);
    } else {
      value = valueOrCall;
    }

    const response = await fetch(`${this.rootUrl}/data/${key}`, {
      method: "PUT",
      body: JSON.stringify({
        data: value,
        type: this.type,
        user: this.user,
        token: this.token,
        session: this.session,
        secret: this.secret,
        key: this.key,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json() as { authToken?: string; };
    this.token = result.authToken;
    return result;
  }
}

export * from "./uploader";
