import { Component, Input, OnInit, signal, effect, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlaylistTrack } from '../playlist.service';
import { PlaybackService } from '../playback.service';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    MatSnackBarModule,
    JsonPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss']
})
export class TrackListComponent implements OnInit {
  @Input({ required: true }) set songs(value: PlaylistTrack[] | null | undefined) {
    const newSongs = Array.isArray(value) ? [...value] : [];
    console.log('Songs input changed, count:', newSongs.length);
    this._songs.set(newSongs);
  }
  
  protected _songs = signal<PlaylistTrack[]>([]);
  protected debug = signal<boolean>(true); // Enable debug by default for now
  
  private readonly snackBar = inject(MatSnackBar);
  private readonly playbackService = inject(PlaybackService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    // Log when songs change
    effect(() => {
      const songs = this._songs();
      console.log('Songs updated:', songs.length);
      if (songs.length > 0) {
        console.log('First song ID:', songs[0].track?.id);
      }
    });
  }

  ngOnInit(): void {
    console.log('TrackListComponent initialized with songs:', this._songs().length);
  }

  /**
   * Gets a comma-separated list of artist names
   */
  getArtists(artists?: Array<{ name?: string }>): string {
    if (!artists || !Array.isArray(artists) || artists.length === 0) {
      return 'Unknown Artist';
    }
    return artists
      .map(artist => artist?.name || 'Unknown Artist')
      .filter(name => name !== 'Unknown Artist')
      .join(', ') || 'Unknown Artist';
  }

  /**
   * Gets the URL of the album art or an empty string if not available
   */
  getAlbumArt(album: { images?: Array<{ url: string }> } | undefined): string {
    if (!album?.images?.[0]?.url) {
      return '';
    }
    return album.images[0].url;
  }

  /**
   * Handles track click events. When a track is clicked, it starts playing that track
   * and continues with the shuffled order from the playlist.
   * 
   * @param track - The track that was clicked
   */
  async onTrackClick(track: PlaylistTrack): Promise<void> {
    if (!track?.track?.id) {
      console.warn('No valid track to play');
      this.showError('Playback Error', 'Could not play the selected track: Invalid track data');
      return;
    }

    try {
      // Play the selected track
      await this.playbackService.playTrack(track);
      console.log('Now playing:', track.track.name);
    } catch (error) {
      console.error('Error playing track:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      this.showError('Playback Error', `Could not play track: ${errorMessage}`);
    }
  }

  /**
   * Track by function for ngFor
   */
  trackByFn(index: number, item: PlaylistTrack): string {
    return item.track?.id || `track-${index}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

  private showError(title: string, message: string): void {
    this.snackBar.open(`${title}: ${message}`, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
