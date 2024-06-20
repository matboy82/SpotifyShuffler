import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SpotifyService } from './spotify.service';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  constructor(private http: HttpClient, private spotifyService: SpotifyService) { }

  public getPlaylistTracks(playlistId: string): Observable<any> {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const headers = this.spotifyService.getAuthHeaders();
    return this.http.get(url, { headers });
  }  

  public getPlaylists(): Observable<any> {
    const url = 'https://api.spotify.com/v1/me/playlists';
    const headers = this.spotifyService.getAuthHeaders();
    return this.http.get(url, { headers });
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
}
