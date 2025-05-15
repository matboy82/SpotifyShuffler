import { Component, DestroyRef, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlaylistItem } from '../interfaces/playlist-item';
import { SpotifyService } from '../spotify.service';
import { CommonModule } from '@angular/common';
import type { Track, PlaybackState, Episode } from '@spotify/web-api-ts-sdk';

interface PlayerState {
  track: Track | Episode | null;
  progress: number;
  isPlaying: boolean;
  duration: number;
}

@Component({
  selector: 'app-playing-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playing-info.component.html',
  styleUrl: './playing-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayingInfoComponent {
  isTrack(item: Track | Episode | null): item is Track {
    return item !== null && 'artists' in item;
  }

  isEpisode(item: Track | Episode | null): item is Episode {
    return item !== null && 'show' in item;
  }
  private readonly POLL_INTERVAL = 1000; // Poll every second
  private readonly PROGRESS_UPDATE_INTERVAL = 100; // Update progress every 100ms

  currentPlaylistInfo = input<PlaylistItem>();
  
  private spotifyService = inject(SpotifyService);
  private destroyRef = inject(DestroyRef);
  private pollInterval: number | null = null;
  private progressUpdateInterval: number | null = null;
  
  readonly playerState = signal<PlayerState>({
    track: null,
    progress: 0,
    isPlaying: false,
    duration: 0
  });

  constructor() {
    this.setupPlayerStateUpdates();
    this.setupProgressUpdates();

    // Clean up on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanupIntervals();
    });
  }

  private cleanupIntervals() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
    }
  }

  private async setupPlayerStateUpdates() {
    try {
      await this.updatePlayerState();
      
      // Set up polling for player state changes
      this.pollInterval = window.setInterval(async () => {
        try {
          const state = await this.spotifyService.getSdk().player.getPlaybackState();
          if (state?.is_playing && state.item) {
            this.playerState.set({
              track: state.item,
              progress: state.progress_ms ?? 0,
              isPlaying: state.is_playing,
              duration: state.item.duration_ms
            });
          } else if (!state?.is_playing) {
            this.playerState.update(state => ({
              ...state,
              isPlaying: false
            }));
          }
        } catch (error) {
          console.error('Error updating player state:', error);
        }
      }, this.POLL_INTERVAL);
    } catch (error) {
      console.error('Error setting up player state updates:', error);
    }
  }

  private setupProgressUpdates() {
    // Update progress every 100ms when playing
    this.progressUpdateInterval = window.setInterval(() => {
      const state = this.playerState();
      if (state.isPlaying && state.track) {
        this.playerState.update(s => ({
          ...s,
          progress: Math.min(s.progress + 100, s.duration)
        }));
      }
    }, this.PROGRESS_UPDATE_INTERVAL);
  }

  private async updatePlayerState() {
    try {
      const state = await this.spotifyService.getSdk().player.getPlaybackState();
      if (state?.is_playing && state.item?.type === 'track') {
        const track = state.item as Track;
        this.playerState.set({
          track,
          progress: state.progress_ms ?? 0,
          isPlaying: state.is_playing,
          duration: track.duration_ms
        });
      }
    } catch (error) {
      console.error('Error updating player state:', error);
    }
  }

  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
