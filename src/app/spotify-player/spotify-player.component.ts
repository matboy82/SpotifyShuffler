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
  
  

  playerInit() {
    // shuffle songs
    const shuffledSongs = this.playlistService.shuffleTracks(this.songs);
    console.log(shuffledSongs);
    console.log(this.songs);
    

    this.sdk.player.getAvailableDevices().then((data) => {  
      console.log(data);
      const device = data.devices[0];
      console.log(device.id);
      this.sdk.player.startResumePlayback(device.id as string, undefined, this.songs.map((song) => song.track.uri), undefined, 0).then((data) => {
        console.log(data);
      });
    });
  }

  pauseTrack(): void {
  //  this.sdk.player.pausePlayback().then((data) => {
  //    console.log(data);
  //  })
  }

  nextTrack(): void {
    // Implement next track logic here
  }

  previousTrack(): void {
    // Implement previous track logic here
  }
}