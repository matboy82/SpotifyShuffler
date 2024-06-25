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
  private tracks!: PlaylistedTrack<Track>[]
  private currentPlaylist: PlaylistItem = {} as PlaylistItem;
  public lists = signal(this.playlists);
  public songs = signal(this.tracks);
  public playlist = signal<PlaylistItem>(this.currentPlaylist);

  constructor(private spotifyService: SpotifyService) {
    this.sdk = this.spotifyService.getSdk();
   }

  public getPlaylistTracks(playlistId: string) {
    this.sdk.playlists.getPlaylistItems(playlistId).then((data) => {
      console.log(data.items);
      const newSongs = data.items as unknown as PlaylistedTrack<Track>[];
      this.songs.set(newSongs);
      this.getTrackInfo(newSongs[0].track.id);
    });
  }  

  public shuffleTracks(tracks: PlaylistedTrack<Track>[]): PlaylistedTrack<Track>[] {
    console.log(tracks);
    return this.shuffleArray(tracks);
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