// const CACHE_URL_BASE = "https://cache-grab-worker.vincentlequang.workers.dev/";
const CACHE_URL_BASE = "https://5kx5ne03pg.execute-api.us-east-1.amazonaws.com/cache-grab?url=";

export async function getCDNCacheUrl(url: string) {
  const cacheUrl = `${CACHE_URL_BASE}${url}`;
  const response = await fetch(cacheUrl);
  const json = await response.json();
  return json?.url ?? null;;
}
