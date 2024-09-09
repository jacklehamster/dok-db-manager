import type { DbApi } from "@dobuki/data-client";

interface Props {
  rootUrl: string;
  user: string;
  type: string;
  session: string;
  secret?: string;
}

export class DokDb implements DbApi {
  rootUrl: string;
  user: string;
  token?: string;
  session?: string;
  secret?: string;
  type: string;

  constructor({ rootUrl, user, type, session, secret }: Props) {
    this.rootUrl = rootUrl;
    this.user = user;
    this.type = type;
    this.session = session;
    this.secret = secret;
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

    const params = new URLSearchParams();
    params.set("user", this.user);
    if (this.token) {
      params.set("token", this.token);
    }
    if (this.session) {
      params.set("session", this.session);
    }
    if (this.secret) {
      params.set("secret", this.secret);
    }

    const response = await fetch(`${this.rootUrl}/data/${key}?${params}`, {
      method: "PUT",
      body: JSON.stringify(value),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json() as { authToken?: string; };
    this.token = result.authToken;
    return result;
  }
}
