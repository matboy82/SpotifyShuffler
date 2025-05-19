import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PlaylistService, PlaylistTrack } from './playlist.service';
import { SpotifyService } from './spotify.service';
import { NotificationService } from './services/notification.service';
import { PlaylistItem } from './interfaces/playlist-item';

describe('PlaylistService', () => {
  let service: PlaylistService;
  let mockSpotifyService: jasmine.SpyObj<SpotifyService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockSdk: jasmine.SpyObj<any>;

  // Mock data
  const mockPlaylistItem: PlaylistItem = {
    id: 'playlist1',
    name: 'Test Playlist',
    images: [{ url: 'http://test.com/image.jpg' }],
    tracks: { total: 10 }
  } as PlaylistItem;

  const mockTrack: PlaylistTrack = {
    track: {
      id: 'track1',
      name: 'Test Track',
      album: {
        images: [{ url: 'http://test.com/album.jpg' }]
      },
      artists: [{ name: 'Test Artist' }]
    }
  };

  beforeEach(() => {
    // Create spies for dependencies
    mockSdk = jasmine.createSpyObj('SpotifyApi', {
      'playlists.getPlaylistItems': Promise.resolve({ items: [mockTrack] }),
      'search': Promise.resolve({ playlists: { items: [mockPlaylistItem] } }),
      'tracks.get': Promise.resolve({})
    });

    mockSpotifyService = jasmine.createSpyObj('SpotifyService', ['getSdk']);
    mockSpotifyService.getSdk.and.returnValue(mockSdk);

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['error', 'warning']);

    TestBed.configureTestingModule({
      providers: [
        PlaylistService,
        { provide: SpotifyService, useValue: mockSpotifyService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    });

    service = TestBed.inject(PlaylistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPlaylistTracks', () => {
    it('should return tracks for a valid playlist ID', async () => {
      // Act
      const result = await service.getPlaylistTracks('playlist1');

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].track?.id).toBe('track1');
      expect(mockSdk.playlists.getPlaylistItems).toHaveBeenCalledWith('playlist1');
    });

    it('should handle empty playlist ID', async () => {
      // Act
      const result = await service.getPlaylistTracks('');

      // Assert
      expect(result).toEqual([]);
      expect(mockNotificationService.error).toHaveBeenCalledWith('No playlist selected', 'Please select a playlist to load tracks');
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockSdk.playlists.getPlaylistItems.and.returnValue(Promise.reject(error));

      // Act
      const result = await service.getPlaylistTracks('playlist1');

      // Assert
      expect(result).toEqual([]);
      expect(mockNotificationService.error).toHaveBeenCalledWith('Failed to load playlist', 'API Error');
    });
  });

  describe('shuffleTracks', () => {
    it('should shuffle tracks and update state', () => {
      // Arrange
      const tracks = [
        { track: { id: '1', name: 'Track 1' } },
        { track: { id: '2', name: 'Track 2' } },
        { track: { id: '3', name: 'Track 3' } }
      ] as PlaylistTrack[];

      // Act
      const result = service.shuffleTracks(tracks);

      // Assert
      expect(result.length).toBe(tracks.length);
      expect(service.isShuffled()).toBeTrue();
      // Note: We can't test the actual shuffle result due to randomness
      // but we can test that all original tracks are still there
      const resultIds = result.map(t => t.track?.id).sort();
      const expectedIds = tracks.map(t => t.track?.id).sort();
      expect(resultIds).toEqual(expectedIds);
    });

    it('should handle empty tracks array', () => {
      // Act
      const result = service.shuffleTracks([]);

      // Assert
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('No tracks to shuffle');
    });
  });

  describe('searchPlaylists', () => {
    it('should search for playlists and update state', async () => {
      // Arrange
      const searchTerm = 'test';
      const mockResults = {
        playlists: {
          items: [
            { id: '1', name: 'Test Playlist', images: [{ url: 'test.jpg' }] }
          ]
        }
      };
      mockSdk.search.and.returnValue(Promise.resolve(mockResults));

      // Act
      service.searchPlaylists(searchTerm);

      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(mockSdk.search).toHaveBeenCalledWith(
        searchTerm,
        ['playlist'],
        undefined,
        20
      );
      // Verify the lists signal was updated with the mock results
      const currentLists = service.lists();
      expect(currentLists.length).toBe(1);
      expect(currentLists[0].name).toBe('Test Playlist');
    });

    it('should handle search errors', async () => {
      // Arrange
      const error = new Error('Search failed');
      mockSdk.search.and.returnValue(Promise.reject(error));

      // Act
      service.searchPlaylists('test');

      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Search failed',
        'Failed to search for playlists'
      );
    });
  });

  describe('resetState', () => {
    it('should reset all state', () => {
      // Arrange
      service['tracks'] = [mockTrack as PlaylistTrack];
      service['currentPlaylist'] = mockPlaylistItem;
      service['songs'].set([mockTrack as PlaylistTrack]);
      service['playlist'].set(mockPlaylistItem);

      // Act
      service.resetState();

      // Assert
      expect(service['tracks']).toEqual([]);
      expect(service['currentPlaylist']).toEqual({} as PlaylistItem);
      // Verify songs signal was reset
      expect(service.songs()).toEqual([]);
      
      // Verify playlist signal was reset
      expect(service.playlist()).toEqual({} as PlaylistItem);
    });
  });
});

// Mock console.warn for testing
beforeEach(() => {
  spyOn(console, 'warn');
});
