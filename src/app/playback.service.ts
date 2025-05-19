import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { SpotifyService } from './spotify.service';
import { PlaylistService, PlaylistTrack } from './playlist.service';
import { NotificationService } from './services/notification.service';
import { Device } from './interfaces/device';
import { PlaybackState, Track, type Device as SpotifyDevice } from '@spotify/web-api-ts-sdk';

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

  private mapTrackToCurrentTrack(track: Track | null): void {
    if (track) {
      this.currentTrack.set({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album?.name || 'Unknown Album',
        image: track.album?.images?.[0]?.url || '',
        duration: track.duration_ms,
        progress: 0
      });
    } else {
      this.currentTrack.set(null);
    }
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

  constructor(private notification: NotificationService) {}

  private async getAvailableDevices(): Promise<Device[]> {
    try {
      const player = this.sdk.player;
      const devices = await player.getAvailableDevices();
      return devices.devices.map(device => ({
        id: device.id,
        name: device.name || 'Unknown Device',
        type: device.type || 'computer',
        is_active: device.is_active,
        is_private_session: device.is_private_session || false,
        is_restricted: device.is_restricted || false,
        volume_percent: device.volume_percent ?? 50
      }));
    } catch (error) {
      console.error('Error fetching available devices:', error);
      return [];
    }
  }

  async playTracks(): Promise<void> {
    // First try to get the current device
    let device = this.currentDevice();
    
    // If no device is selected, try to get available devices
    if (!device?.id) {
      const availableDevices = (await this.getAvailableDevices()).filter((d): d is Device & { id: string } => d.id !== null);
      if (availableDevices.length > 0) {
        // Try to find an active device first
        const activeDevice = availableDevices.find(d => d.is_active);
        if (activeDevice) {
          this.setDevice(activeDevice);
          device = this.currentDevice();
        } else {
          // If no active device but we have available devices, use the first one
          this.setDevice(availableDevices[0]);
          device = this.currentDevice();
        }
      }
      
      // If still no device, show error
      if (!device?.id) {
        this.notification.error(
          'No Playback Device',
          'Please make sure you have an active Spotify session on a device. Open the Spotify app on your device and try again.'
        );
        return;
      }
    }
    
    try {
      let songs = this.playlistService.songs();
      if (!songs || songs.length === 0) {
        this.notification.warning('No songs available. Please select a playlist with tracks to play');
        return;
      }

      // If not already shuffled, shuffle the tracks
      if (!this.playlistService.isShuffled()) {
        console.log('Shuffling tracks');
        const shuffledSongs = this.playlistService.shuffleTracks([...songs]);
        if (!shuffledSongs || shuffledSongs.length === 0) {
          this.notification.error('Failed to shuffle tracks');
          return;
        }
        // Use the shuffled songs for playback
        songs = shuffledSongs;
      } else {
        // If already shuffled, get the current shuffled tracks from the service
        songs = this.playlistService.songs();
      }

      // Convert track IDs to Spotify URIs
      const trackUris = songs
        .filter(song => song.track?.id)
        .map(song => `spotify:track:${song.track!.id}`);
      
      if (trackUris.length === 0) {
        this.notification.error('The playlist does not contain any playable tracks');
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
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        this.notification.error(`Could not start playback: ${errorMessage}`);
        throw error;
      }

      this.playingSignal.set(true);
      await this.updatePlaybackState();
    } catch (error) {
      console.error('Error playing tracks:', error);
      throw error; // Re-throw to allow error handling in components
    }
  }

  async playTrack(track: PlaylistTrack): Promise<void> {
    if (!track?.track?.id) {
      console.warn('No track ID provided');
      return;
    }

    // First try to get the current device
    let device = this.currentDevice();
    
    // If no device is selected, try to get available devices
    if (!device?.id) {
      const availableDevices = (await this.getAvailableDevices()).filter((d): d is Device & { id: string } => d.id !== null);
      if (availableDevices.length > 0) {
        // Try to find an active device first
        const activeDevice = availableDevices.find(d => d.is_active);
        if (activeDevice) {
          this.setDevice(activeDevice);
          device = this.currentDevice();
        } else {
          // If no active device but we have available devices, use the first one
          this.setDevice(availableDevices[0]);
          device = this.currentDevice();
        }
      }
      
      // If still no device, show error
      if (!device?.id) {
        this.notification.error(
          'No Playback Device',
          'Please make sure you have an active Spotify session on a device. Open the Spotify app on your device and try again.'
        );
        return;
      }
    }

    try {
      const trackUri = `spotify:track:${track.track.id}`;
      await this.sdk.player.startResumePlayback(
        device.id,
        undefined,
        [trackUri] // Pass track URI directly as an array
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
      this.notification.error('No active device', 'Please start a device first');
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

  startStatePolling(): void {
    if (this.statePollingActive) return;
    
    // Update state immediately
    void this.updatePlaybackState();

    // Poll for state changes every second
    this.pollInterval = window.setInterval(() => {
      void this.updatePlaybackState();
    }, 1000);
    
    this.statePollingActive = true;
  }

  stopStatePolling(): void {
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
