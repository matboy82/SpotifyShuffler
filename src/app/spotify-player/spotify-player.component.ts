import { ChangeDetectionStrategy, Component, Input, OnInit, inject, input } from '@angular/core';
import { SpotifyService } from '../spotify.service';
import { PlaylistService } from '../playlist.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-spotify-player',
  standalone: true,
  imports: [],
  templateUrl: './spotify-player.component.html',
  styleUrl: './spotify-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpotifyPlayerComponent implements OnInit {
  
        
@Input() playlistId!: string;   

  tracks: any[] = [];
  shuffledTracks: any[] = [];

  constructor(private spotifyService: SpotifyService, private playlistService: PlaylistService) { }

  ngOnInit(): void {
  }


  playTrack(track: any): void {
    // Implement playback logic here
  }

  pauseTrack(): void {
    // Implement pause logic here
  }

  nextTrack(): void {
    // Implement next track logic here
  }

  previousTrack(): void {
    // Implement previous track logic here
  }
}