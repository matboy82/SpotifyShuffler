import { Routes } from '@angular/router';
import { SpotifyPlayerComponent } from './spotify-player/spotify-player.component';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'player/:playlistId', loadComponent: () => import('./spotify-player/spotify-player.component').then(m => m.SpotifyPlayerComponent)},
];
