import { TestBed } from '@angular/core/testing';

import { WebPlaybackService } from './web-playback.service';

describe('WebPlaybackService', () => {
  let service: WebPlaybackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebPlaybackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
