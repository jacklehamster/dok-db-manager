// To recognize dom types (see https://bun.sh/docs/typescript#dom-types):
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import React, { useCallback, useEffect, useMemo } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DokDb, Uploader } from "dok-db-manager-client";

const div = document.body.appendChild(document.createElement("div"));

const dokDb = new DokDb({
  rootUrl: window.location.origin,
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
    // console.log(data);
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
      setData(undefined);
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
  }, [keyViewed, data]);

  const extension = useMemo(() => data?.url?.split(".").pop(), [data?.url]);
  //console.log(extension, loading, data?.type);

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
    {!loading && textAreaData && <>
      <textarea cols={100} rows={20} title="Data" value={textAreaData}
        onChange={e => setTextAreaData(e.target.value)}></textarea>
      <br></br>
      <button type="button" onClick={() => saveData()} title="Click me">
        Save
      </button>
    </>}
    {!loading && data?.type === "blob" && (extension === "png" || extension === "jpg") && <img title={data?.url} src={data?.url} />}
    {!loading && data?.type === "blob" && extension === "mp3" && 
    <audio controls>
      <source src={data.url} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>}
    {loading && <div>Loading...</div>}
    <Uploader 
    domain="art.dobuki.net"
    group="example"
    repo={{
      owner: "dobuki",
      name: "art-depot",
    }} />
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
