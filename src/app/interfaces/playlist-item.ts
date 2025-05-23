import { Owner } from "./owner";
import { Image } from "./image";
import { PlaylistedTrack, Track } from "@spotify/web-api-ts-sdk";

export interface PlaylistItem {
    collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: Owner;
  primary_color: null;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
    items?: PlaylistedTrack<Track>[];
  };
  type: string;
  uri: string;
}
