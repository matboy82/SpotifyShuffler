import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { SpotifyService } from './spotify.service';
import { PlaylistService, PlaylistTrack } from './playlist.service';
import { Device } from './interfaces/device';
import { PlaybackState, Track } from '@spotify/web-api-ts-sdk';

@Injectable({
  providedIn: 'root'
})
export class PlaybackService {
  private sdk = inject(SpotifyService).getSdk();
  private playlistService = inject(PlaylistService);
  
  private currentDeviceSignal = signal<Device | undefined>(undefined);
  private playingSignal = signal<boolean>(false);
  private pollInterval: number | undefined;
  private statePollingActive = false;

  readonly currentDevice: Signal<Device | undefined> = computed(() => this.currentDeviceSignal());
  readonly playing: Signal<boolean> = computed(() => this.playingSignal());
  
  // Track the current track for display purposes
  currentTrack = signal<{
    id: string;
    name: string;
    artist: string;
    album: string;
    image: string;
    duration: number;
    progress: number;
  } | null>(null);

  // Type guard to check if the item is a Track
  private isTrack(item: any): item is Track {
    return item && 'type' in item && item.type === 'track';
  }

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
    if (!device?.id) {
      console.warn('No active device found');
      return;
    }
    
    try {
      let songs = this.playlistService.songs();
      if (!songs || songs.length === 0) {
        console.warn('No songs available to play');
        return;
      }

      // If not already shuffled, shuffle the tracks
      if (!this.playlistService.isShuffled()) {
        console.log('Shuffling tracks');
        songs = this.playlistService.shuffleTracks([...songs]);
      }

      // Convert track IDs to Spotify URIs
      const trackUris = songs
        .filter(song => song.track?.id)
        .map(song => `spotify:track:${song.track!.id}`);
      
      console.log('first songs uri: ' + songs[0].track?.id);
      console.log('first songs uri: ' + trackUris[0]);
      if (trackUris.length === 0) {
        console.warn('No valid track URIs to play');
        return;
      }

      // Start playback with the track URIs using the correct parameter structure
      try {
        // Use type assertion to bypass the type checking for this specific call
        const player = this.sdk.player as any;
        // @ts-ignore - The SDK type definition expects a different parameter structure
        await (player.startResumePlayback as any)(
          device.id,
          undefined,
          trackUris, // Pass array of URIs directly
          undefined,
          0 // Start from the beginning of the first track
        );
      } catch (error) {
        console.error('Error starting playback:', error);
        throw error;
      }

      this.playingSignal.set(true);
      await this.updatePlaybackState();
    } catch (error) {
      console.error('Error playing tracks:', error);
      throw error; // Re-throw to allow error handling in components
    }
  }

  async playTrack(song: PlaylistTrack): Promise<void> {
    const device = this.currentDevice();
    if (!device?.id) {
      console.error('No active device');
      return;
    }

    if (!song.track?.id) {
      console.error('No track ID available');
      return;
    }

    try {
      await this.sdk.player.startResumePlayback(
        device.id,
        undefined,
        [`spotify:track:${song.track.id}`] // Pass track URI directly as an array
      );
      this.playingSignal.set(true);
      await this.updatePlaybackState();
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
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
      this.playingSignal.set(false);
    } catch (error) {
      console.error('Error pausing track:', error);
      // Even if there's an error, update the local state to reflect the intended pause
      this.playingSignal.set(false);
      throw error;
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
    if (this.statePollingActive) return;
    
    // Update state immediately
    void this.updatePlaybackState();

    // Poll for state changes every second
    this.pollInterval = window.setInterval(() => {
      void this.updatePlaybackState();
    }, 1000);
    
    this.statePollingActive = true;
  }

  stopStatePolling() {
    if (this.pollInterval) {
      window.clearInterval(this.pollInterval);
      this.pollInterval = undefined;
      this.statePollingActive = false;
    }
  }

  async updatePlaybackState() {
    try {
      const state = await this.sdk.player.getPlaybackState();
      this.updatePlayingState(state);
    } catch (error) {
      console.error('Error getting playback state:', error);
    }
  }

  private updatePlayingState(state: PlaybackState | null) {
    if (!state) {
      this.playingSignal.set(false);
      this.currentTrack.set(null);
      return;
    }

    this.playingSignal.set(state.is_playing ?? false);
    
    // Update current track information
    if (state.item && this.isTrack(state.item)) {
      const track = state.item as Track;
      this.currentTrack.set({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album?.name || 'Unknown Album',
        image: track.album?.images?.[0]?.url || '',
        duration: track.duration_ms,
        progress: state.progress_ms || 0
      });
    } else {
      this.currentTrack.set(null);
    }
  }
}
