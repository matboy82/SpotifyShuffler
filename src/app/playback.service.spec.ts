import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlaybackService } from './playback.service';
import { SpotifyService } from './spotify.service';
import { PlaylistService } from './playlist.service';
import { NotificationService } from './services/notification.service';
import { Device } from './interfaces/device';
import { of } from 'rxjs';

describe('PlaybackService', () => {
  let service: PlaybackService;
  let mockSpotifyService: jasmine.SpyObj<SpotifyService>;
  let mockPlaylistService: jasmine.SpyObj<PlaylistService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockSdk: jasmine.SpyObj<any>;

  // Mock data
  const mockDevice: Device = {
    id: 'test-device-1',
    name: 'Test Device',
    type: 'computer',
    is_active: true,
    is_private_session: false,
    is_restricted: false,
    volume_percent: 50
  };

  const mockTrack = {
    track: {
      id: 'track1',
      name: 'Test Track',
      album: {
        name: 'Test Album',
        images: [{ url: 'http://test.com/album.jpg' }]
      },
      artists: [{ name: 'Test Artist' }],
      duration_ms: 200000
    }
  };

  beforeEach(() => {
    // Create spies for dependencies
    mockSdk = jasmine.createSpyObj('SpotifyApi', {
      'player.getAvailableDevices': Promise.resolve({ devices: [mockDevice] }),
      'player.startResumePlayback': Promise.resolve({}),
      'player.pausePlayback': Promise.resolve({}),
      'player.skipToNext': Promise.resolve({}),
      'player.skipToPrevious': Promise.resolve({}),
      'player.getPlaybackState': Promise.resolve({
        is_playing: true,
        item: {
          id: 'track1',
          name: 'Test Track',
          artists: [{ name: 'Test Artist' }],
          album: {
            name: 'Test Album',
            images: [{ url: 'http://test.com/album.jpg' }]
          },
          duration_ms: 200000
        },
        progress_ms: 10000
      })
    });

    mockSpotifyService = jasmine.createSpyObj('SpotifyService', ['getSdk']);
    mockSpotifyService.getSdk.and.returnValue(mockSdk);

    mockPlaylistService = jasmine.createSpyObj('PlaylistService', {
      'songs': [mockTrack],
      'isShuffled': false,
      'shuffleTracks': [mockTrack]
    });

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['error', 'warning']);

    TestBed.configureTestingModule({
      providers: [
        PlaybackService,
        { provide: SpotifyService, useValue: mockSpotifyService },
        { provide: PlaylistService, useValue: mockPlaylistService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    });

    service = TestBed.inject(PlaybackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setDevice', () => {
    it('should set the current device', () => {
      // Act
      service.setDevice(mockDevice);

      // Assert
      expect(service['currentDevice']()).toEqual(mockDevice);
    });
  });

  describe('getAvailableDevices', () => {
    it('should return available devices', async () => {
      // Act
      const devices = await service['getAvailableDevices']();

      // Assert
      expect(devices.length).toBe(1);
      expect(devices[0].id).toBe('test-device-1');
      expect(mockSdk.player.getAvailableDevices).toHaveBeenCalled();
    });

    it('should handle errors when fetching devices', async () => {
      // Arrange
      mockSdk.player.getAvailableDevices.and.returnValue(Promise.reject(new Error('API Error')));

      // Act
      const devices = await service['getAvailableDevices']();

      // Assert
      expect(devices).toEqual([]);
    });
  });

  describe('playTracks', () => {
    it('should play tracks on the current device', async () => {
      // Arrange
      service.setDevice(mockDevice);

      // Act
      await service.playTracks();

      // Assert
      expect(mockSdk.player.startResumePlayback).toHaveBeenCalled();
      expect(service['playing']()).toBeTrue();
    });

    it('should handle no device available', async () => {
      // Act
      await service.playTracks();

      // Assert
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'No Playback Device',
        'Please make sure you have an active Spotify session on a device. Open the Spotify app on your device and try again.'
      );
    });
  });

  describe('playTrack', () => {
    it('should play a specific track', async () => {
      // Arrange
      service.setDevice(mockDevice);

      // Act
      await service.playTrack(mockTrack);

      // Assert
      expect(mockSdk.player.startResumePlayback).toHaveBeenCalled();
      expect(service['playing']()).toBeTrue();
    });
  });

  describe('pauseTrack', () => {
    it('should pause the current track', async () => {
      // Arrange
      service.setDevice(mockDevice);
      service['playingSignal'].set(true);

      // Act
      await service.pauseTrack();

      // Assert
      expect(mockSdk.player.pausePlayback).toHaveBeenCalledWith(mockDevice.id);
      expect(service['playing']()).toBeFalse();
    });

    it('should handle no device when pausing', async () => {
      // Act
      await service.pauseTrack();

      // Assert
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'No active device',
        'Please start a device first'
      );
    });
  });

  describe('playback control', () => {
    beforeEach(() => {
      service.setDevice(mockDevice);
    });

    it('should go to next track', async () => {
      // Act
      await service.nextTrack();

      // Assert
      expect(mockSdk.player.skipToNext).toHaveBeenCalled();
    });

    it('should go to previous track', async () => {
      // Act
      await service.previousTrack();

      // Assert
      expect(mockSdk.player.skipToPrevious).toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should start and stop state polling', fakeAsync(() => {
      // Act
      service.startStatePolling();
      tick(2000); // Advance time to trigger the first poll
      
      // Assert
      expect(service['statePollingActive']).toBeTrue();
      
      // Act
      service.stopStatePolling();
      
      // Assert
      expect(service['statePollingActive']).toBeFalse();
    }));

    it('should update playback state', async () => {
      // Act
      await service.updatePlaybackState();

      // Assert
      expect(service.currentTrack()).toBeTruthy();
      expect(service.currentTrack()?.name).toBe('Test Track');
    });
  });
});
