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
  private spotifyService = inject(SpotifyService);
  private currentDeviceSignal = signal<Device | undefined>(undefined);
  private playingSignal = signal<boolean>(false);
  private isPaused = signal<boolean>(false);
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

  /**
   * Ensure a playback device is available
   * @returns The available device or null if none found
   */
  private async ensureDeviceAvailable(): Promise<Device | null> {
    let device = this.currentDevice();
    if (device?.id) return device;

    const availableDevices = (await this.getAvailableDevices())
      .filter((d): d is Device & { id: string } => d.id !== null);
    
    device = availableDevices.find(d => d.is_active) || availableDevices[0];
    if (device) {
      this.setDevice(device);
      return device;
    }

    this.notification.error(
      'No Playback Device',
      'Please make sure you have an active Spotify session on a device.'
    );
    return null;
  }

  /**
   * Resume playback from paused state
   */
  private async resumePlayback(device: Device): Promise<boolean> {
    console.log('resuming playback');
    if (!this.isPaused()) return false;
    
    try {
      console.log('try block resumePlayback');
      try {
        await this.sdk.player.startResumePlayback(device.id as string);
      } catch (apiError) {
        // If we get a JSON parse error, it might still have worked
        if (!(apiError instanceof Error) || !apiError.message.includes('Unexpected token')) {
          throw apiError; // Re-throw if it's a different error
        }
        console.log('Non-JSON response from Spotify API - assuming playback resumed');
      }
      
      this.playingSignal.set(true);
      this.isPaused.set(false);
      return true;
    } catch (error) {
      console.error('Error resuming playback:', error);
      return false;
    }
  }

  /**
   * Prepare track URIs for playback
   */
  private prepareTracksForPlayback(): string[] | null {
    const currentIndex = this.currentTrackIndex();
    const tracks = this.isShuffled() ? this.shuffledTracks() : this.playlistService.songs();
    
    if (currentIndex < 0 || currentIndex >= tracks.length) {
      this.notification.error('Invalid track index');
      return null;
    }

    return tracks
      .slice(currentIndex)
      .map(track => track.track?.id ? `spotify:track:${track.track.id}` : null)
      .filter(Boolean) as string[];
  }

  /**
   * Start playback with the given tracks
   */
  private async startPlayback(device: Device, trackUris: string[]): Promise<void> {
    try {
      console.log('try block startPlayback');
      await this.sdk.player.startResumePlayback(device.id as string || '', undefined, trackUris);
      this.playingSignal.set(true);
      this.isPaused.set(false);
      await this.updatePlaybackState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      this.notification.error('Playback Error', `Could not start playback: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Initialize or update the shuffled tracks list if needed
   */
  private initializeShuffledTracks(): boolean {
    const songs = this.playlistService.songs();
    if (!songs || songs.length === 0) {
      this.notification.warning('No songs available. Please select a playlist with tracks to play');
      return false;
    }

    if (this.shuffledTracks().length === 0 || !this.isShuffled()) {
      const shuffledSongs = this.playlistService.shuffleTracks([...songs]);
      if (!shuffledSongs || shuffledSongs.length === 0) {
        this.notification.error('Failed to shuffle tracks');
        return false;
      }
      this.shuffledTracks.set(shuffledSongs);
      this.isShuffled.set(true);
      console.log('shuffled tracks initialized');
    }

    return true;
  }

  /**
   * Main method to handle track playback
   * @param track Optional track to play. If not provided, plays from current position
   * @param startFromBeginning Whether to start from the beginning of the playlist
   */
  public async playTrack(track?: PlaylistTrack, startFromBeginning = true): Promise<void> {
    console.log('playTrack called with:', { track: track?.track?.name, startFromBeginning });
    
    // Ensure we have a device to play on
    const device = await this.ensureDeviceAvailable();
    if (!device) {
      console.log('No device available');
      return;
    }

    // Handle pause/resume - if we're resuming, we don't want to change the track index
    if (this.isPaused()) {
      console.log('Playback is paused, attempting to resume');
      const resumed = await this.resumePlayback(device);
      if (resumed) {
        console.log('Successfully resumed playback');
        return;
      }
      console.log('Resume playback failed, continuing with normal playback');
    }

    // Initialize or update shuffled tracks if needed
    if (!this.initializeShuffledTracks()) {
      console.log('Failed to initialize shuffled tracks');
      return;
    }

    // Only update track index if we're not resuming and either:
    // 1. A specific track is provided, or
    // 2. We're explicitly told to start from the beginning
    if (track?.track?.id) {
      console.log('Updating track index for specific track');
      const tracks = this.shuffledTracks();
      const trackIndex = tracks.findIndex(t => t.track?.id === track.track?.id);
      this.currentTrackIndex.set(trackIndex !== -1 ? trackIndex : tracks.length);
    } else if (startFromBeginning) {
      console.log('Starting playback from beginning of playlist');
      this.currentTrackIndex.set(0);
    } else {
      console.log('Continuing playback from current track index:', this.currentTrackIndex());
    }

    // Prepare and play tracks
    const trackUris = this.prepareTracksForPlayback();
    if (trackUris?.length) {
      console.log('Starting playback with', trackUris.length, 'tracks');
      await this.startPlayback(device, trackUris);
    } else {
      console.log('No tracks available to play');
      this.notification.info('No tracks available to play');
    }
  }

  async pauseTrack(): Promise<void> {
    const device = this.currentDevice();
    if (!device?.id) {
      this.notification.error('No active device', 'Please start a device first');
      return;
    }
    
    try {
      console.log('pauseTrack');
      await this.sdk.player.pausePlayback(device.id);
      this.playingSignal.set(false);
      this.isPaused.set(true);
    } catch (error) {
      console.error('Error pausing playback:', error);
      // this.notification.error('Error', 'Could not pause playback');
      // Even if there's an error, update the local state to reflect the intended pause
      this.playingSignal.set(false);
      this.isPaused.set(true);
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
      
      // Skip to the next track using the Spotify Web Player
      await this.spotifyService.sdk.player.skipToNext(device.id as string);
      
    } catch (error) {
      console.error('Error skipping to next track:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      // this.notification.error('Playback Error', `Could not skip to next track: ${errorMessage}`);
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
      await this.playTrack();
      
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
