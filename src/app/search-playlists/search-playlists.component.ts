import { Component } from '@angular/core';
import { MaterialModule } from '../material/material.module';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-search-playlists',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, FormsModule],
  templateUrl: './search-playlists.component.html',
  styleUrl: './search-playlists.component.scss'
})
export class SearchPlaylistsComponent {

  searchForm!: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.searchForm = this.formBuilder.group({
      value: ['', [Validators.required]]
    });
    
  }

  value = '';
  search() {
    console.log(this.searchForm.controls['value'].value);
  }

  checkForErrorsIn(formControl: AbstractControl): string {
    if (formControl.hasError('required')) {
      return 'Search value is required'
    }
    return ''
  }
}
