import { Component, Input, OnInit, signal, effect } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlaylistTrack } from '../playlist.service';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    JsonPipe
  ],
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
   * Handles track click events
   */
  onTrackClick(track: PlaylistTrack): void {
    console.log('Track clicked:', track);
    // TODO: Implement track playback using PlaybackService
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
}
