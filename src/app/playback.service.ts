import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { SpotifyService } from './spotify.service';
import { PlaylistService } from './playlist.service';
import { Device } from './interfaces/device';
import { PlaybackState } from '@spotify/web-api-ts-sdk';

@Injectable({
  providedIn: 'root'
})
export class PlaybackService {
  private sdk = inject(SpotifyService).getSdk();
  private playlistService = inject(PlaylistService);
  
  private currentDeviceSignal = signal<Device | undefined>(undefined);
  private playingSignal = signal<boolean>(false);
  private pollInterval: number | undefined;

  readonly currentDevice: Signal<Device | undefined> = computed(() => this.currentDeviceSignal());
  readonly playing: Signal<boolean> = computed(() => this.playingSignal());

  setDevice(device: Device) {
    this.currentDeviceSignal.set(device);
  }

  async playerInit() {
    const songs = this.playlistService.songs();
    if (songs && songs.length > 0) {
      this.playlistService.shuffleTracks(songs);
    } else {
      console.warn('No songs available to shuffle');
    }
  }

  async playTracks(): Promise<void> {
    const device = this.currentDevice();
    if (!device) {
      alert('Start a device first');
      return;
    }
    
    try {
      const songs = this.playlistService.songs();
      if (!songs || songs.length === 0) {
        console.warn('No songs available to play');
        return;
      }

      const songUrls = songs.map((song) => song.track.uri);
      await this.sdk.player.startResumePlayback(
        device.id as string,
        undefined,
        songUrls,
        undefined,
        undefined
      );

      await this.updatePlaybackState();
    } catch (error) {
      console.error('Error playing tracks:', error);
    }
  }

  async pauseTrack(): Promise<void> {
    const device = this.currentDevice();
    if (!device) {
      alert('Start a device first');
      return;
    }

    try {
      await this.sdk.player.pausePlayback(device.id as string);
      await this.updatePlaybackState();
    } catch (error) {
      console.error('Error pausing track:', error);
    }
  }

  async nextTrack(): Promise<void> {
    const device = this.currentDevice();
    if (!device) {
      alert('Start a device first');
      return;
    }

    try {
      await this.sdk.player.skipToNext(device.id as string);
      await this.updatePlaybackState();
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  }

  async previousTrack(): Promise<void> {
    const device = this.currentDevice();
    if (!device) {
      alert('Start a device first');
      return;
    }

    try {
      await this.sdk.player.skipToPrevious(device.id as string);
      await this.updatePlaybackState();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  }

  startStatePolling() {
    // Update state immediately
    void this.updatePlaybackState();

    // Poll for state changes every second
    this.pollInterval = window.setInterval(() => {
      void this.updatePlaybackState();
    }, 1000);
  }

  stopStatePolling() {
    if (this.pollInterval) {
      window.clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  private async updatePlaybackState() {
    try {
      const state = await this.sdk.player.getPlaybackState();
      this.updatePlayingState(state);
    } catch (error) {
      console.error('Error getting playback state:', error);
    }
  }

  private updatePlayingState(state: PlaybackState | null) {
    if (state) {
      this.playingSignal.set(state.is_playing ?? false);
    }
  }
}
