/// <reference lib="dom" />

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

export function Uploader() {
  const [secret, setSecret] = React.useState("");
  useEffect(() => {
    setSecret(window.localStorage.getItem("secret") || "");
  }, []);
  useEffect(() => {
    window.localStorage.setItem("secret", secret);
  }, [secret]);

  return <>
    <form action="/save-image" method="post" encType="multipart/form-data">
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

export const insertUploaderInDiv = (div: HTMLDivElement) => {
  const root = ReactDOM.createRoot(div);
  root.render(<Uploader />);
};
