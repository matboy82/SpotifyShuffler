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
  
  // Track the current position in the playlist and the shuffled order
  private currentTrackIndex = signal<number>(-1);
  private shuffledTracks = signal<PlaylistTrack[]>([]);
  private isShuffled = signal<boolean>(false);

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

  async playTracks(startFromBeginning: boolean = true): Promise<void> {
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

      // Initialize or update shuffled tracks if needed
      if (this.shuffledTracks().length === 0 || !this.isShuffled()) {
        const shuffledSongs = this.playlistService.shuffleTracks([...songs]);
        if (!shuffledSongs || shuffledSongs.length === 0) {
          this.notification.error('Failed to shuffle tracks');
          return;
        }
        this.shuffledTracks.set(shuffledSongs);
        this.isShuffled.set(true);
      }

      // Reset track index if starting from beginning
      if (startFromBeginning) {
        this.currentTrackIndex.set(0);
      }

      // Get the current track to play
      const currentTrack = this.getCurrentTrack();
      if (!currentTrack?.track?.id) {
        this.notification.error('No track to play');
        return;
      }

      // Start playback with the current track and remaining tracks in context
      try {
        const currentIndex = this.currentTrackIndex();
        const tracks = this.isShuffled() ? this.shuffledTracks() : this.playlistService.songs();
        const remainingTracks = tracks.slice(currentIndex).map(track => `spotify:track:${track.track?.id}`).filter(Boolean);
        
        if (remainingTracks.length === 0) {
          this.notification.info('No tracks available to play');
          return;
        }
        
        await this.sdk.player.startResumePlayback(
          device.id,
          undefined,
          remainingTracks
        );
        this.playingSignal.set(true);
        await this.updatePlaybackState();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        this.notification.error(`Could not start playback: ${errorMessage}`);
        throw error;
      }
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

    // Find the track in our shuffled tracks
    const tracks = this.shuffledTracks();
    const trackIndex = tracks.findIndex(t => t.track?.id === track.track?.id);
    
    if (trackIndex === -1) {
      // If track not found in shuffled tracks, add it and update the index
      this.shuffledTracks.update(current => [...current, track]);
      this.currentTrackIndex.set(tracks.length);
    } else {
      // Set the current track index to the found track
      this.currentTrackIndex.set(trackIndex);
    }
    
    // Play the track
    await this.playTracks(false);
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
  
  /**
   * Gets the current track from the shuffled playlist
   */
  private getCurrentTrack(): PlaylistTrack | undefined {
    const index = this.currentTrackIndex();
    const tracks = this.shuffledTracks();
    
    if (index >= 0 && index < tracks.length) {
      return tracks[index];
    }
    return undefined;
  }
  
  /**
   * Updates the current track index when the playlist changes
   */
  public updateTrackIndexes(originalIndexes: number[]): void {
    if (!this.isShuffled()) return;
    
    const currentTrack = this.getCurrentTrack();
    if (!currentTrack) return;
    
    // Find the new index of the current track in the updated playlist
    const newIndex = originalIndexes.findIndex(id => 
      currentTrack.track?.id === this.shuffledTracks()[id]?.track?.id
    );
    
    if (newIndex !== -1) {
      this.currentTrackIndex.set(newIndex);
    }
  }

  async nextTrack(): Promise<void> {
    const device = this.currentDevice();
    if (!device) {
      this.notification.error('No Active Device', 'Please start a device first');
      return;
    }

    try {
      // Move to the next track in our shuffled playlist
      const nextIndex = this.currentTrackIndex() + 1;
      const tracks = this.shuffledTracks();
      
      if (nextIndex >= tracks.length) {
        // Reached the end of the playlist
        this.playingSignal.set(false);
        this.currentTrackIndex.set(-1);
        this.notification.info('Playback: Reached the end of the playlist');
        return;
      }

      // Update the current track index
      this.currentTrackIndex.set(nextIndex);
      
      // Play the next track
      await this.playTracks(false);
      
    } catch (error) {
      console.error('Error skipping to next track:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      this.notification.error('Playback Error', `Could not skip to next track: ${errorMessage}`);
    }
  }

  async previousTrack(): Promise<void> {
    const device = this.currentDevice();
    if (!device) {
      this.notification.error('No Active Device', 'Please start a device first');
      return;
    }

    try {
      // Move to the previous track in our shuffled playlist
      const prevIndex = this.currentTrackIndex() - 1;
      
      if (prevIndex < 0) {
        // Already at the first track
        this.notification.info('Playback: Already at the first track');
        return;
      }

      // Update the current track index
      this.currentTrackIndex.set(prevIndex);
      
      // Play the previous track
      await this.playTracks(false);
      
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      this.notification.error('Playback Error', `Could not skip to previous track: ${errorMessage}`);
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

  async updatePlaybackState(): Promise<PlaybackState | null> {
    try {
      const state = await this.sdk.player.getPlaybackState();
      this.updatePlayingState(state);
      
      // If the track changed, update our current track index
      if (state?.item?.type === 'track') {
        const currentTrackId = state.item.id;
        const currentIndex = this.shuffledTracks().findIndex(
          t => t.track?.id === currentTrackId
        );
        
        if (currentIndex !== -1 && currentIndex !== this.currentTrackIndex()) {
          this.currentTrackIndex.set(currentIndex);
        }
      }
      
      return state;
    } catch (error) {
      console.error('Error getting playback state:', error);
      return null;
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
