import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayingInfoComponent } from './playing-info.component';

describe('PlayingInfoComponent', () => {
  let component: PlayingInfoComponent;
  let fixture: ComponentFixture<PlayingInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayingInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayingInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
