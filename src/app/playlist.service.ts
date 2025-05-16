import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { SpotifyService } from './spotify.service';
import { Playlist, PlaylistedTrack, SpotifyApi, Track, SimplifiedAlbum } from '@spotify/web-api-ts-sdk';
import { PlaylistItem } from './interfaces/playlist-item';

export interface PlaylistTrack {
  track?: {
    id?: string;
    name?: string;
    album?: {
      images?: Array<{ url: string }>;
    };
    artists?: Array<{ name: string }>;
  };
  [key: string]: any; // Allow other properties from PlaylistedTrack
}

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  private sdk!: SpotifyApi;
  private playlists: PlaylistItem[] = [];
  private tracks: PlaylistTrack[] = [];
  private shuffledTracks: PlaylistTrack[] = [];
  private currentPlaylist: PlaylistItem = {} as PlaylistItem;
  private _isShuffled = false;
  
  public lists: WritableSignal<PlaylistItem[]> = signal<PlaylistItem[]>(this.playlists);
  public songs: WritableSignal<PlaylistTrack[]> = signal<PlaylistTrack[]>(this.tracks);
  public playlist: WritableSignal<PlaylistItem> = signal<PlaylistItem>(this.currentPlaylist);
  
  public isShuffled(): boolean {
    return this._isShuffled;
  }

  constructor(private spotifyService: SpotifyService) {
    this.sdk = this.spotifyService.getSdk();
   }

  public resetState() {
    this.tracks = [];
    this.currentPlaylist = {} as PlaylistItem;
    this.songs.set([]);
    this.playlist.set({} as PlaylistItem);
  }

  public async getPlaylistTracks(playlistId: string): Promise<void> {
    if (!playlistId) {
      console.error('No playlist ID provided');
      this.songs.set([]);
      return;
    }

    // Reset state before loading new tracks
    this.resetState();
    this._isShuffled = false;

    try {
      console.log('Loading playlist tracks for ID:', playlistId);
      const data = await this.sdk.playlists.getPlaylistItems(playlistId);
      
      // Ensure we have valid data
      if (!data?.items) {
        console.error('Invalid playlist data received:', data);
        this.songs.set([]);
        return;
      }

      // Transform the data to match our PlaylistTrack interface
      const newSongs: PlaylistTrack[] = data.items.map(item => ({
        ...item,
        track: item.track ? {
          id: item.track.id,
          name: item.track.name,
          album: item.track.album ? {
            images: item.track.album.images
          } : undefined,
          artists: item.track.artists?.map(artist => ({
            name: artist.name
          }))
        } : undefined
      }));

      console.log(`Loaded ${newSongs.length} tracks`);
      
      // Update state
      this.tracks = [...newSongs];
      this.shuffledTracks = [];
      
      // Update the signal with the new data
      this.songs.set([...newSongs]);
      
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
      this.songs.set([]);
    }
  }  

  public shuffleTracks(tracks: PlaylistTrack[]): PlaylistTrack[] {
    if (!tracks || tracks.length === 0) return [];
    
    // Create a copy of the array to avoid modifying the original
    const shuffled = [...tracks];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    this.shuffledTracks = [...shuffled];
    this._isShuffled = true;
    console.log('setting shuffled tracks');
    this.songs.set([...shuffled]);
    
    return [...shuffled];
  }

  private shuffleArray(array: PlaylistTrack[]): PlaylistTrack[] {
    // Create a copy to avoid mutating the original array
    const newArray = [...array];
    let currentIndex = newArray.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }

    return newArray;
  }

  public searchPlaylists(searchTerm: string) {
    //searchtypes: 'album', 'track','artist', 'show', 'episode'
    this.sdk.search(searchTerm, ['playlist'], undefined, 20).then((results) => {
      const newLists = results.playlists.items as unknown as PlaylistItem[];
      this.lists.set(newLists);
    });
  }  

  public getTrackInfo(trackId: string) {
    this.sdk.tracks.get(trackId).then((data) => {
      console.log(data);
    });
  }
}