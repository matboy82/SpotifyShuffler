import { Component, Input, OnInit } from '@angular/core';
import { SpotifyService } from '../spotify.service';
import { PlaylistService } from '../playlist.service';

@Component({
  selector: 'app-spotify-player',
  standalone: true,
  imports: [],
  templateUrl: './spotify-player.component.html',
  styleUrl: './spotify-player.component.scss'
})
export class SpotifyPlayerComponent implements OnInit {
  
  @Input() playlistId = '';

  tracks: any[] = [];
  shuffledTracks: any[] = [];

  constructor(private spotifyService: SpotifyService, private playlistService: PlaylistService) { }

  ngOnInit(): void { }

  setPlaylist(playlistId: string): void {
    this.playlistId = playlistId;
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