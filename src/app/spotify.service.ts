import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private clientId = '7ca110f3b9934a4e9889f3a85fef87b3';
  private clientSecret = 'add2833f0c8b47918f1f38d250353dea';

  constructor(private http: HttpClient) { }

}
