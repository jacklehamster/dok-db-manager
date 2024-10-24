/// <reference lib="dom" />

import React, { useEffect, useMemo } from "react";
import ReactDOM from "react-dom/client";

interface Props {
  repo?: {
    owner: string;
    name: string;
  }
  group?: string;
}

export function Uploader({ repo, group }: Props) {
  const [secret, setSecret] = React.useState("");
  useEffect(() => {
    setSecret(window.localStorage.getItem("secret") || "");
  }, []);
  useEffect(() => {
    window.localStorage.setItem("secret", secret);
  }, [secret]);

  const params = useMemo(() => {
    return new URLSearchParams({
      repoOwner: repo?.owner ?? "",
      repoName: repo?.name ?? "",
      ... group && { group },
    });
  }, [repo, group]);

  return <>
    <form action={`/upload/image?${params.toString()}`} method="post" encType="multipart/form-data">
      <div>
        <label htmlFor="secret">Secret</label>
        <input name="secret" id="secret" type="password" value={secret} onChange={e => setSecret(e.target.value)} />
      </div>
      <label htmlFor="img">Image upload</label>
      <input id="img" type="file" name="image" accept="image/*" required />
      <button type="submit">Upload Image</button>
    </form>
  </>;
}

export const insertUploaderInDiv = (div: HTMLDivElement, repo: Props["repo"]) => {
  const root = ReactDOM.createRoot(div);
  root.render(<Uploader repo={repo} />);
};
