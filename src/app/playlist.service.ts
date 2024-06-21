import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SpotifyService } from './spotify.service';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { PlaylistItem } from './interfaces/playlist-item';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  private sdk!: SpotifyApi;
  private playlists: PlaylistItem[] = [];

  public lists = signal(this.playlists);

  constructor(private spotifyService: SpotifyService) {
    this.sdk = this.spotifyService.getSdk();
   }

  public getPlaylistTracks(playlistId: string): Observable<any> {
    return new Observable;
  }  

  public getPlaylists(): PlaylistItem[] {
    return this.lists();
  }

  public shuffleTracks(tracks: any[]): any[] {
    return this.shuffleArray(tracks);
  }

  public shuffleArray(array: any[]): any[] {
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
      console.log(this.lists());
    });
  }  
}
