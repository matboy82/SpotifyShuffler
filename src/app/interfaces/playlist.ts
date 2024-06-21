import { PlaylistItem } from "./playlist-item";

export interface Playlist {
    href: string;
  limit: number;
  next: null;
  offset: number;
  previous: null;
  total: number;
  items: PlaylistItem[];
}
