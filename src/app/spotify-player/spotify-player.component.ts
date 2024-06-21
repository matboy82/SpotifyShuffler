import { ChangeDetectionStrategy, Component, Input, OnInit, inject, input } from '@angular/core';
import { SpotifyService } from '../spotify.service';
import { PlaylistService } from '../playlist.service';
import { PlaylistedTrack, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { MaterialModule } from '../material/material.module';

@Component({
  selector: 'app-spotify-player',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './spotify-player.component.html',
  styleUrl: './spotify-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpotifyPlayerComponent implements OnInit {
  
        
@Input() playlistId!: string;   

  tracks: any[] = [];
  shuffledTracks: any[] = [];
  sdk: SpotifyApi = inject(SpotifyService).getSdk();
  playlistService = inject(PlaylistService);

  ngOnInit(): void {
    console.log(this.playlistId);

    this.playlistService.getPlaylistTracks(this.playlistId);
  }

  get songs(): PlaylistedTrack<Track>[] {
    console.log(this.playlistService.songs());
   // this.shuffle(this.playlistService.songs());
    return this.playlistService.songs();
  }

  set songs(songs: PlaylistedTrack<Track>[]) {
    this.playlistService.songs.set(songs);
  }
  

  player() {
    // add shuffled songs to player

    const shuffledSongs = this.playlistService.shuffleTracks(this.songs);

    console.log(shuffledSongs);

  //  this.sdk.player.  addSongsToQueue(shuffledSongs);
  //  this.sdk.player.
  }

  

  playTrack(track: any): void {
    // Implement playback logic here
  }

  pauseTrack(): void {
    // Implement pause logic here
  }

  nextTrack(): void {
    // Implement next track logic here
  }

  previousTrack(): void {
    // Implement previous track logic here
  }
}