import { ChangeDetectionStrategy, Component, Input, OnInit, inject, input } from '@angular/core';
import { SpotifyService } from '../spotify.service';
import { PlaylistService } from '../playlist.service';
import { Device, PlaylistedTrack, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { MaterialModule } from '../material/material.module';
import { TrackListComponent } from '../track-list/track-list.component';
import { DeviceService } from '../device.service';

@Component({
  selector: 'app-spotify-player',
  standalone: true,
  imports: [MaterialModule, TrackListComponent],
  templateUrl: './spotify-player.component.html',
  styleUrl: './spotify-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpotifyPlayerComponent implements OnInit {
       
  @Input() playlistId!: string;   
  @Input() showTrackList!: boolean;

  currentDevice!: Device;
  playing!: boolean;
  sdk: SpotifyApi = inject(SpotifyService).getSdk();
  playlistService = inject(PlaylistService);
  deviceService = inject(DeviceService);
  
  ngOnInit(): void {
    this.playlistService.getPlaylistTracks(this.playlistId);
    this.deviceService.getDevices().subscribe((devices) => {
      this.currentDevice = devices[0];
      this.sdk.player.getPlaybackState().then((data) => {
        this.playing = data?.is_playing;
      });
    })
  }
  
  playerInit() {
    console.log(this.playlistService.songs());
    this.playlistService.shuffleTracks(this.playlistService.songs()); // it shuffles on the signal, no need to return a new array
  }

  playTracks(): void {
    if(!this.currentDevice) {
      alert('Start a device first');
      return;
    }

    
    
      this.playing = true;
      console.log(this.playlistService.songs());
      const songUrls = this.playlistService.songs().map((song) => song.track.uri);
      this.sdk.player.startResumePlayback(this.currentDevice.id as string, undefined, songUrls, undefined, undefined).then((data) => {      
        this.sdk.player.getPlaybackState().then((data) => {
          this.playing = data?.is_playing;
          console.log(data.shuffle_state);
        
        }).catch((err) => {
          console.log(err);
        });
      });
      
    
  }

  pauseTrack(): void {
    if(!this.currentDevice) {
      alert('Start a device first');
      return;
    }
    this.playing = false;
    this.sdk.player.pausePlayback(this.currentDevice.id as string).then((data) => {      
    })
  }

  nextTrack(): void {
    if(!this.currentDevice) {
      alert('Start a device first');
      return;
    }
    this.playing = true;
    this.sdk.player.skipToNext(this.currentDevice.id as string).then((data) => {
    });
  }

  previousTrack(): void {
    if(!this.currentDevice) {
      alert('Start a device first');
      return;
    }
    this.playing = true;
    this.sdk.player.skipToPrevious(this.currentDevice.id as string).then((data) => {
    })
  }
}