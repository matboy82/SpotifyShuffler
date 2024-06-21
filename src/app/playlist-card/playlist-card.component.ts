import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, OnInit } from '@angular/core';
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

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log(this.playlist);
  }

  goToPlayer(playlistId: string) {
    this.router.navigate(['player', playlistId]);
  }
}
