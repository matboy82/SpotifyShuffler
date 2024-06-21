import { Component, OnInit, input } from '@angular/core';
import { MaterialModule } from '../material/material.module';
import { PlaylistedTrack, Track } from '@spotify/web-api-ts-sdk';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './track-list.component.html',
  styleUrl: './track-list.component.scss'
})
export class TrackListComponent implements OnInit{

  songs = input<PlaylistedTrack<Track>[]>();

  ngOnInit(): void {
  }

}
