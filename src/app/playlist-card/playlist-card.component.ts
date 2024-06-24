import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, OnInit, output } from '@angular/core';
import { MaterialModule } from '../material/material.module';
import { PlaylistItem } from '../interfaces/playlist-item';
import { Router } from '@angular/router';

@Component({
  selector: 'app-playlist-card',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './playlist-card.component.html',
  styleUrl: './playlist-card.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PlaylistCardComponent implements OnInit{

  @Input() playlist!: PlaylistItem;

  selectedPlaylistId = output<string>();

  constructor(private router: Router) { }

  ngOnInit(): void {
    
  }

  goToPlayer(playlistId: string) {
    this.router.navigate(['player', playlistId]);
  }

  selectPlaylist(playlistId: string) {
    this.selectedPlaylistId.emit(playlistId);
  }
}
