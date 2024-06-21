import { Injectable } from '@angular/core';
import { SpotifyService } from './spotify.service';
import { Device, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  sdk!: SpotifyApi;
  constructor(private spotifyService: SpotifyService) { }

  getDevices(): Observable<Device[]> {
    return from(this.spotifyService.sdk.player.getAvailableDevices().then((data) => {
      return data.devices
    }));
  }
}
