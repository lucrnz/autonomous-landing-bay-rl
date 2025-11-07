import { env } from "@/env";

export const fetchEpisodes = async () => {
  const res = await fetch(`${env.NEXT_PUBLIC_BASE_PATH}api/py/episodes`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch episodes: ${res.status}`);
  }

  return res.json();
};
