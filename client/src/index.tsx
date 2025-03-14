import type { DbApi } from "@dobuki/data-client";
import { encodeSecret } from "./encode";

interface Props {
  rootUrl: string;
  user: string;
  type: string;
  session: string;
  secret?: string;
  secretHash?: string;
  key?: string;
}

interface UploadResult {
  success?: boolean;
  url: string;
  backupUrl: string;
}

interface Repo {
  owner: string;
  name: string;
}

export class DokDb implements DbApi {
  rootUrl: string;
  user: string;
  token?: string;
  session?: string;
  secret?: string;
  type: string;
  key?: string;

  constructor({ rootUrl, user, type, session, secret, secretHash, key }: Props) {
    this.rootUrl = rootUrl;
    this.user = user;
    this.type = type;
    this.session = session;
    this.secret = secretHash ?? encodeSecret(secret);
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

  async setData(key: string, valueOrCall: any, options: {
    repo?: Repo;
  } = {}): Promise<any> {
    let value;
    if (typeof (valueOrCall) === "function") {
      const data = await this.getData(key);
      value = await valueOrCall(data.data, data);
    } else {
      value = valueOrCall;
    }

    const urlVars = new URLSearchParams();
    if (options.repo) {
      urlVars.append("repoName", options.repo.name);
      urlVars.append("repoOwner", options.repo.owner);
    }

    const response = await fetch(`${this.rootUrl}/data/${key}${urlVars.size?"?" + urlVars.toString():""}`, {
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

  async uploadFile({
    fileType,
    file,
    group,
    preUpload,
    repo,
  }: {
    fileType: string;
    file: File;
    group: string;
    repo?: Repo;
    preUpload?: () => Promise<void>;
  }): Promise<UploadResult | undefined> {
    const formData = new FormData();
    formData.append(fileType, file);
    formData.append("group", group);

    if (this.secret) {
      formData.append("secret", this.secret);
    }
    if (this.user && this.session && this.key) {
      formData.append("type", this.type);
      formData.append("key", this.key);
      formData.append("user", this.user);
      formData.append("session", this.session);
    }

    await preUpload?.();

    const urlVars = new URLSearchParams();
    if (repo) {
      urlVars.append("repoName", repo.name);
      urlVars.append("repoOwner", repo.owner);  
    }
    urlVars.append("group", group);

    const url = `${this.rootUrl}/upload/${fileType}${urlVars.size ? "?" + urlVars.toString() : ""}`;
    const json = await fetch(url, { method: "POST", body: formData }).then(res => res.json());

    if (json.success) {
      return json;
    } else {
      console.error(json);
    }    
  }

  async uploadBlob({
    name,
    blob,
    repo,
    group,
    preUpload,
   } : {
    name: string;
    blob: Blob;
    repo: { name: string; owner: string };
    group: string;
    preUpload?: () => Promise<void>;
  }) {
    const formData = new FormData();
    formData.append("bin", blob, name);
  
    // Append other necessary fields
    if (this.secret) {
      formData.append("secret", this.secret);
    }
    if (this.user && this.session && this.key) {
      formData.append("type", this.type);
      formData.append("key", this.key);
      formData.append("user", this.user);
      formData.append("session", this.session);
    }
  
    await preUpload?.();
  
    const urlVars = new URLSearchParams();
    if (repo) {
      urlVars.append("repoName", repo.name);
      urlVars.append("repoOwner", repo.owner);  
    }
    urlVars.append("group", group);
  
    const url = `${this.rootUrl}/upload/bin${urlVars.size ? "?" + urlVars.toString() : ""}`;
    const json = await fetch(url, { method: "POST", body: formData }).then(res => res.json());
  
    if (json.success) {
      return json;
    } else {
      console.error(json);
      throw new Error("Upload failed");
    }
  }  
}

export * from "./uploader";
