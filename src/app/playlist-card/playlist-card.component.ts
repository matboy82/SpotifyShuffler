import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, OnInit, inject, output } from '@angular/core';
import { MaterialModule } from '../material/material.module';
import { PlaylistItem } from '../interfaces/playlist-item';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-playlist-card',
    standalone: true,
    imports: [MaterialModule, RouterModule],
    templateUrl: './playlist-card.component.html',
    styleUrl: './playlist-card.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlaylistCardComponent implements OnInit{

  router = inject(Router);
  @Input({ required: true }) playlist!: PlaylistItem;

  selectedPlaylistId = output<string>();

  ngOnInit(): void {
    
  }

  goToPlayer(playlistId: string) {
    this.router.navigate(['player', playlistId]);
  }

  selectPlaylist(playlistId: string) {
    this.selectedPlaylistId.emit(playlistId);
  }
}
