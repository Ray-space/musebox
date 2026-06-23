import songsData from "@content/songs.json";
import type { Song } from "@/types";

export function getAllSongs(): Song[] {
  return songsData.songs as Song[];
}

export function getSongById(id: string): Song | undefined {
  return getAllSongs().find((song) => song.id === id);
}

export function getSongsByStrategy(strategy: Song["strategy"]): Song[] {
  return getAllSongs().filter((song) => song.strategy === strategy);
}
