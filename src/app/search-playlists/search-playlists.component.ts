import { ChangeDetectionStrategy, Component, EventEmitter, Output, output } from '@angular/core';
import { MaterialModule } from '../material/material.module';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlaylistService } from '../playlist.service';
import { PlaylistItem } from '../interfaces/playlist-item';

@Component({
  selector: 'app-search-playlists',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, FormsModule],
  templateUrl: './search-playlists.component.html',
  styleUrl: './search-playlists.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPlaylistsComponent {
  value = '';
  searchForm!: FormGroup;

  constructor(private formBuilder: FormBuilder, private searchService: PlaylistService) {
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
    return ''
  }
}
