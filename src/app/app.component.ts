import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SpotifyService } from './spotify.service';
import { PlaylistService } from './playlist.service';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { MaterialModule } from './material/material.module';
import { PlaylistItem } from './interfaces/playlist-item';
import { PlaylistCardComponent } from './playlist-card/playlist-card.component';
import { SearchPlaylistsComponent } from './search-playlists/search-playlists.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MaterialModule, PlaylistCardComponent, SearchPlaylistsComponent],
  providers: [SpotifyService, PlaylistService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit{
  
  constructor(private spotifyService: SpotifyService, private playlistService: PlaylistService) {
  }

   ngOnInit(): void {    
   }


}
