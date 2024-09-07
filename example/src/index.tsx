// To recognize dom types (see https://bun.sh/docs/typescript#dom-types):
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import React, { useCallback } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DokDb } from "dok-db-manager-client";

const div = document.body.appendChild(document.createElement("div"));

const dokDb = new DokDb({
  rootUrl: "http://localhost:3000",
  user: "jacklehamster",
  type: "newgrounds",
  session: "example",
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

  return <>
    <button type="button" onClick={() => {
      list();
    }}>List</button>
    <>{keys.map(({key, type}) => {
      if (type === "tree") {
        return <div key={key}>{key}</div>;        
      } else {
        return <button key={key} type="button" onClick={async () => {
          setLoading(true);
          const data = await dokDb.getData(key);
          setData(data);
          setLoading(false);
        }
      }>{key} ({type})</button>;
    }})}
    </>
    <hr></hr>
    {data?.type === "object" && <div>{JSON.stringify(data.data)}</div>}
    <hr></hr>
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
