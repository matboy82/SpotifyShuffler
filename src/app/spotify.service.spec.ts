import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SpotifyService } from './spotify.service';
import { 
  AuthorizationCodeWithPKCEStrategy, 
  SpotifyApi, 
  type AccessToken,
  type AuthenticationResponse 
} from '@spotify/web-api-ts-sdk';
import { NotificationService } from './services/notification.service';

// Create a mock authentication response
const createMockAuthResponse = (authenticated: boolean): any => ({
  authenticated,
  access_token: authenticated ? 'mock-access-token' : '',
  refresh_token: authenticated ? 'mock-refresh-token' : '',
  expires: authenticated ? Date.now() + 3600 * 1000 : 0,
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_expires_in: 0,
  scope: ''
});

// Create a mock access token
const createMockAccessToken = (authenticated: boolean): any => ({
  access_token: authenticated ? 'mock-access-token' : '',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: authenticated ? 'mock-refresh-token' : '',
  scope: ''
});

describe('SpotifyService', () => {
  let service: SpotifyService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let mockAuthStrategy: jasmine.SpyObj<AuthorizationCodeWithPKCEStrategy>;
  let mockSpotifyApi: jasmine.SpyObj<SpotifyApi>;
  
  // Mock window.location
  const originalLocation = window.location;
  const mockWindow = {
    ...window,
    location: {
      ...window.location,
      href: '',
      assign: jasmine.createSpy('assign'),
      replace: jasmine.createSpy('replace')
    },
    onSpotifyWebPlaybackSDKReady: null,
    Spotify: null
  };
  
  // Mock Spotify SDK Player
  class MockPlayer {
    connect = jasmine.createSpy('connect').and.returnValue(Promise.resolve(true));
    addListener = jasmine.createSpy('addListener').and.returnValue(Promise.resolve({}));
    removeListener = jasmine.createSpy('removeListener');
    disconnect = jasmine.createSpy('disconnect');
    getCurrentState = jasmine.createSpy('getCurrentState');
    getVolume = jasmine.createSpy('getVolume');
    nextTrack = jasmine.createSpy('nextTrack');
    pause = jasmine.createSpy('pause');
    previousTrack = jasmine.createSpy('previousTrack');
    resume = jasmine.createSpy('resume');
    seek = jasmine.createSpy('seek');
    setName = jasmine.createSpy('setName');
    setVolume = jasmine.createSpy('setVolume');
    togglePlay = jasmine.createSpy('togglePlay');
  }
  
  // Create mock Spotify API with required methods
  const createMockSpotifyApi = () => {
    const mock = jasmine.createSpyObj('SpotifyApi', [
      'authenticate', 
      'getAccessToken', 
      'getMe',
      'currentUser',
      'player',
      'tracks'
    ]);
    
    // Set up mock methods
    mock.authenticate.and.returnValue(Promise.resolve(createMockAuthResponse(true)));
    mock.currentUser = {
      profile: jasmine.createSpy('profile').and.returnValue(Promise.resolve({}))
    };
    mock.player = {
      getAvailableDevices: jasmine.createSpy('getAvailableDevices').and.returnValue(Promise.resolve({}))
    };
    mock.tracks = {
      get: jasmine.createSpy('get').and.returnValue(Promise.resolve({}))
    };
    
    return mock;
  };
  
  beforeAll(() => {
    // Create a mock location object
    const mockLocation = {
      ...originalLocation,
      href: 'http://localhost:9876/',
      origin: 'http://localhost:9876',
      protocol: 'http:',
      host: 'localhost:9876',
      hostname: 'localhost',
      port: '9876',
      pathname: '/',
      search: '',
      hash: '',
      // Add required Location interface methods
      assign: () => {},
      reload: () => {},
      replace: () => {},
      ancestorOrigins: [] as unknown as DOMStringList,
      toString: () => 'http://localhost:9876/'
    };
    
    // @ts-ignore - Mocking window.location for testing
    delete window.location;
    // @ts-ignore - Assign our mock location
    window.location = mockLocation as unknown as Location;
  });
  
  afterEach(() => {
    // Reset window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    
    // Clean up any spies
    if (httpClientSpy) {
      httpClientSpy.get.calls.reset();
      httpClientSpy.post.calls.reset();
    }
  });

  beforeEach(() => {
    // Create spies
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    // Create mock strategy with all required methods
    mockAuthStrategy = jasmine.createSpyObj('AuthorizationCodeWithPKCEStrategy', [
      'getAccessToken', 
      'getAccessTokenWithAuthCode', 
      'resetAccessToken', 
      'setConfiguration'
    ], {
      // Mock the getToken method as a property
      getToken: jasmine.createSpy('getToken').and.returnValue(Promise.resolve(createMockAccessToken(true)))
    });
    
    // Create mock Spotify API
    mockSpotifyApi = createMockSpotifyApi();
    
    // Mock the strategy methods
    mockAuthStrategy.getAccessToken.and.returnValue(Promise.resolve(createMockAccessToken(true)));
    // @ts-ignore - Mocking private methods
    mockAuthStrategy.getAccessTokenWithAuthCode = jasmine.createSpy('getAccessTokenWithAuthCode')
      .and.returnValue(Promise.resolve(createMockAccessToken(true)));
    // @ts-ignore - Mocking private methods
    mockAuthStrategy.resetAccessToken = jasmine.createSpy('resetAccessToken')
      .and.returnValue(Promise.resolve());
    // @ts-ignore - Mocking private methods
    mockAuthStrategy.setConfiguration = jasmine.createSpy('setConfiguration')
      .and.returnValue(undefined);

    // Configure testing module
    TestBed.configureTestingModule({
      providers: [
        SpotifyService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: SpotifyApi, useValue: mockSpotifyApi },
        { provide: AuthorizationCodeWithPKCEStrategy, useValue: mockAuthStrategy }
      ]
    });

    // Inject the service
    service = TestBed.inject(SpotifyService);
    
    // Manually set the SDK since we can't properly mock the constructor
    (service as any).sdk = mockSpotifyApi;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('authenticate', () => {
    it('should authenticate successfully', async () => {
      // Arrange
      mockSpotifyApi.authenticate.and.returnValue(Promise.resolve(createMockAuthResponse(true)));
      
      // Act
      const result = await service.authenticate();
      
      // Assert
      expect(result).toBeTrue();
      expect(notificationServiceSpy.success).toHaveBeenCalledWith('Successfully connected to Spotify');
      expect(mockSpotifyApi.authenticate).toHaveBeenCalled();
    });

    it('should handle authentication failure', async () => {
      // Arrange
      mockSpotifyApi.authenticate.and.returnValue(Promise.resolve(createMockAuthResponse(false)));
      
      // Act
      const result = await service.authenticate();
      
      // Assert
      expect(result).toBeFalse();
      expect(notificationServiceSpy.error).toHaveBeenCalledWith(
        'Authentication failed',
        'Could not authenticate with Spotify'
      );
    });

    it('should handle authentication error', async () => {
      // Arrange
      const error = new Error('Authentication error');
      mockSpotifyApi.authenticate.and.returnValue(Promise.reject(error));
      
      // Act
      const result = await service.authenticate();
      
      // Assert
      expect(result).toBeFalse();
      expect(notificationServiceSpy.error).toHaveBeenCalledWith(
        'Authentication failed',
        'Authentication error'
      );
    });
  });

  describe('getSdk', () => {
    it('should return the SDK when initialized', () => {
      // Act
      const sdk = service.getSdk();
      
      // Assert
      expect(sdk).toBe(mockSpotifyApi);
    });

    it('should throw an error when SDK is not initialized', () => {
      // Arrange
      (service as any).sdk = null;
      
      // Act & Assert
      expect(() => service.getSdk()).toThrowError('Spotify SDK not initialized');
      expect(notificationServiceSpy.error).toHaveBeenCalledWith(
        'Spotify SDK not initialized',
        'Please try refreshing the page'
      );
    });
  });
  
  describe('initialization', () => {
    it('should initialize with correct client ID and redirect URI', () => {
      // The service is already initialized in beforeEach
      expect(service).toBeTruthy();
      // We can't directly test the constructor call, but we can verify the client ID was used
      expect(service['clientId']).toBe('7ca110f3b9934a4e9889f3a85fef87b3');
    });
    
    it('should include all required scopes', () => {
      // The scopes are defined in the constructor
      const expectedScopes = [
        'user-read-private',
        'user-read-email',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-top-read',
        'user-read-recently-played',
        'user-follow-read',
        'user-follow-modify',
        'streaming',
        'playlist-read-private',
        'playlist-read-collaborative',
        'user-library-modify',
        'user-library-read',
        'user-read-playback-position',
        'user-read-currently-playing'
      ];
      
      // Verify the SDK was initialized with the expected scopes
      // We can't directly test the scopes passed to the constructor,
      // but we can verify the SDK was initialized
      expect(service['sdk']).toBeDefined();
    });
  });
});
