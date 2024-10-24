// const CACHE_URL_BASE = "https://cache-grab-worker.vincentlequang.workers.dev/";
const CACHE_URL_BASE = "https://5kx5ne03pg.execute-api.us-east-1.amazonaws.com/cache-grab?url=";

export async function getCDNCacheUrl(url: string): Promise<string | null> {
  const cacheUrl = `${CACHE_URL_BASE}${url}`;
  const response = await fetch(cacheUrl);
  const json = await response.json();
  return json?.url ?? null;;
}

const CACHED_HOMEPAGE: Record<string, string> = {
}

export async function getHomepageUrl(repoOwner: string, repoName: string): Promise<string | null> {
  const repoTag = `${repoOwner}/${repoName}`;
  if (CACHED_HOMEPAGE[repoTag]) {
    return CACHED_HOMEPAGE[repoTag];
  }
  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
  const response = await fetch(apiUrl);
  const json = await response.json();
  return json?.homepage ?? null;;
}
