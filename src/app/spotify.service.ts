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

  public getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });
  }

  public authenticate(): Observable<any> {

    const url = 'https://accounts.spotify.com/api/token';
    const body = 'grant_type=client_credentials';
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
    });

    return this.http.post(url, body, { headers });
  }

  public userAuthorized(): string {
    
    const scope = 'playlist-read-private streaming app-remote-control user-library-read user-read-private user-read-email';
    const params = new HttpParams()
   .set('response_type', 'code')
   .set('client_id', this.clientId)
   .set('redirect_uri', 'localhost:4200')
   .set('scope', scope);
    const queryParams = {
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: 'localhost:4200',
      scope: scope,
    };
    
    return `https://accounts.spotify.com/authorize?${params.toString()}`;  
  }

  public getMe(): Observable<any> {
    const url = 'https://api.spotify.com/v1/me';
    const headers = this.getAuthHeaders();
    return this.http.get(url, { headers });
  }
}
