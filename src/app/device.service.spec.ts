import { TestBed } from '@angular/core/testing';
import { DeviceService } from './device.service';
import { SpotifyService } from './spotify.service';
import { of } from 'rxjs';

describe('DeviceService', () => {
  let service: DeviceService;
  let mockSpotifyService: jasmine.SpyObj<SpotifyService>;
  let mockSdk: jasmine.SpyObj<any>;

  const mockDevices = [
    {
      id: 'device1',
      name: 'Test Device',
      type: 'computer',
      is_active: true,
      is_private_session: false,
      is_restricted: false,
      volume_percent: 50
    },
    {
      id: 'device2',
      name: 'Phone',
      type: 'smartphone',
      is_active: false,
      is_private_session: false,
      is_restricted: false,
      volume_percent: 30
    }
  ];

  beforeEach(() => {
    // Create spy for SDK
    mockSdk = jasmine.createSpyObj('SpotifyApi', {
      'player.getAvailableDevices': Promise.resolve({ devices: mockDevices })
    });

    // Create spy for SpotifyService
    mockSpotifyService = jasmine.createSpyObj('SpotifyService', [], {
      sdk: mockSdk
    });

    TestBed.configureTestingModule({
      providers: [
        DeviceService,
        { provide: SpotifyService, useValue: mockSpotifyService }
      ]
    });

    service = TestBed.inject(DeviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDevices', () => {
    it('should return an Observable of devices', (done) => {
      // Act
      const result$ = service.getDevices();

      // Assert
      result$.subscribe(devices => {
        expect(devices.length).toBe(2);
        expect(devices[0].id).toBe('device1');
        expect(devices[1].name).toBe('Phone');
        done();
      });

      // Verify the SDK method was called
      expect(mockSdk.player.getAvailableDevices).toHaveBeenCalled();
    });

    it('should handle errors when fetching devices', (done) => {
      // Arrange
      const error = new Error('Failed to fetch devices');
      mockSdk.player.getAvailableDevices.and.returnValue(Promise.reject(error));

      // Spy on console.error to verify error is logged
      spyOn(console, 'error');

      // Act
      const result$ = service.getDevices();

      // Assert
      result$.subscribe({
        next: () => fail('Expected error, but got success'),
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith('Error getting devices:', error);
          done();
        }
      });
    });
  });
});
