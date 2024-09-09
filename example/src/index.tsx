// To recognize dom types (see https://bun.sh/docs/typescript#dom-types):
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import React, { useCallback, useEffect } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DokDb } from "dok-db-manager-client";

const div = document.body.appendChild(document.createElement("div"));

const dokDb = new DokDb({
  rootUrl: "http://localhost:3000",
  user: "jacklehamster",
  type: "newgrounds",
  session: "example",
  secret: await fetch("/secret").then(r => r.text()),
});

export interface Key {
  key: string;
  type: string;
}

const HelloComponent = () => {
  const [keys, setKeys] = React.useState<Key[]>([]);
  const list = useCallback(async () => {
    const data = await dokDb.listKeys();
    console.log(data);
    setKeys(data);
  }, []);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{type?: string|null; url?: string; data: any}|undefined>();
  const [textAreaData, setTextAreaData] = React.useState("");
  
  useEffect(() => {
    try {
      const data = JSON.parse(textAreaData);
      setData({type: "object", data});
    } catch (e) {
      setTextAreaData("");
    }
  }, [textAreaData]);

  const [keyViewed, setKeyViewed] = React.useState("");

  const loadKey = useCallback(async (key: string) => {
    setKeyViewed(key);
    setLoading(true);
    const data = await dokDb.getData(key);
    setData(data);
    setTextAreaData(JSON.stringify(data.data, null, 2));
    setLoading(false);
  }, []);

  const saveData = useCallback(async () => {
    if (data?.type === "object") {
      await dokDb.setData(keyViewed, data.data);
      loadKey(keyViewed);
    }
  }, [keyViewed, textAreaData]);

  


  return <>
    <button type="button" onClick={() => {
      list();
    }}>List</button>
    <>{keys.map(({key, type}) => {
      if (type === "tree") {
        return <div key={key}>{key}</div>;        
      } else {
        return <button key={key} type="button" onClick={async () => loadKey(key)}>
          {key} ({type})
        </button>;
    }})}
    </>
    <hr></hr>
    <>{keyViewed}</>
    <hr></hr>
    {!loading && data?.type === "object" && <>
      <textarea cols={100} rows={20} title="Data" value={textAreaData}
        onChange={e => setTextAreaData(e.target.value)}></textarea>
      <br></br>
      <button type="button" onClick={() => saveData()} title="Click me">
        Save
      </button>
    </>}
    {!loading && data?.type === "blob" && <img title={data.url} src={data.url} />}
    {loading && <div>Loading...</div>}
  </>;
};


//  HelloComponent
const root = createRoot(div);
root.render(location.search.indexOf("strict-mode") >= 0 ?
  <StrictMode>
    <HelloComponent />
  </StrictMode> : <HelloComponent />
);


export {};
