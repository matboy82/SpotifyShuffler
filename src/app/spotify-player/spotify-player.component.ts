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

  currentDevice!: Device; //todo this should be gotten from device service
    
  sdk: SpotifyApi = inject(SpotifyService).getSdk();
  playlistService = inject(PlaylistService);
  deviceService = inject(DeviceService);

  ngOnInit(): void {
    this.playlistService.getPlaylistTracks(this.playlistId);
    this.deviceService.getDevices().subscribe((devices) => {
      console.log(devices);
      this.currentDevice = devices[0];
    })
  }

  get songs(): PlaylistedTrack<Track>[] {
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
    console.log(this.currentDevice);
  }

  playTracks(): void {
    this.sdk.player.startResumePlayback(this.currentDevice.id as string, undefined, this.songs.map((song) => song.track.uri), undefined, 0).then((data) => {
      console.log(data);
    });  
  }

  pauseTrack(): void {
    this.sdk.player.pausePlayback(this.currentDevice.id as string).then((data) => {
      console.log(data);
    })
  }

  nextTrack(): void {
    this.sdk.player.skipToNext(this.currentDevice.id as string).then((data) => {
      console.log(data);
    });
  }

  previousTrack(): void {
    this.sdk.player.skipToPrevious(this.currentDevice.id as string).then((data) => {
      console.log(data);
    })
  }
}