import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SpotifyService } from './spotify.service';
import { Playlist, PlaylistedTrack, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { PlaylistItem } from './interfaces/playlist-item';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  private sdk!: SpotifyApi;
  private playlists: PlaylistItem[] = [];
  private tracks: PlaylistedTrack<Track>[] = [];
  private shuffledTracks: PlaylistedTrack<Track>[] = [];
  private currentPlaylist: PlaylistItem = {} as PlaylistItem;
  private _isShuffled = false;
  
  public lists = signal(this.playlists);
  public songs = signal(this.tracks);
  public playlist = signal<PlaylistItem>(this.currentPlaylist);
  
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

  public async getPlaylistTracks(playlistId: string) {
    // Reset state before loading new tracks
    this.resetState();
    this._isShuffled = false;

    try {
      const data = await this.sdk.playlists.getPlaylistItems(playlistId);
      const newSongs = data.items;
      this.tracks = newSongs;
      this.shuffledTracks = [];
      this.songs.set(newSongs);
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
      this.songs.set([]);
    }
  }  

  public shuffleTracks(tracks: PlaylistedTrack<Track>[]): PlaylistedTrack<Track>[] {
    if (!tracks || tracks.length === 0) return [];
    
    // Create a copy of the array to avoid modifying the original
    const shuffled = [...tracks];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    this.shuffledTracks = shuffled;
    this._isShuffled = true;
    this.songs.set(shuffled);
    
    return shuffled;
  }

  private shuffleArray(array: PlaylistedTrack<Track>[]): PlaylistedTrack<Track>[] {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
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