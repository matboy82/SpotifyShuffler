import { ChangeDetectionStrategy, Component, EventEmitter, inject, OnInit, Output, output } from '@angular/core';
import { MaterialModule } from '../material/material.module';

import { PlaylistService } from '../playlist.service';
import { PlaylistItem } from '../interfaces/playlist-item';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

@Component({
    selector: 'app-search-playlists',
    standalone: true,
    imports: [MaterialModule, ReactiveFormsModule, FormsModule],    
    templateUrl: './search-playlists.component.html',
    styleUrl: './search-playlists.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPlaylistsComponent implements OnInit {
  
  formBuilder = inject(FormBuilder);
  searchService = inject(PlaylistService);
  value = '';
  searchForm!: FormGroup;

  ngOnInit(): void {
    this.searchForm = this.formBuilder.group({
      value: ['', [Validators.required]]
    });
  }
  
  search() {
    this.searchService.searchPlaylists(this.searchForm.controls['value'].value);    
  }

  checkForErrorsIn(formControl: AbstractControl): string {
    if (formControl.hasError('required')) {
      return 'Search value is required'
    }
    return '';
  }
}
