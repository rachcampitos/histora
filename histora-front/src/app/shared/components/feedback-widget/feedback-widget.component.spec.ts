import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';

import { FeedbackWidgetComponent, FeedbackData } from './feedback-widget.component';

describe('FeedbackWidgetComponent', () => {
  let component: FeedbackWidgetComponent;
  let fixture: ComponentFixture<FeedbackWidgetComponent>;

  const mockFeedbackData: FeedbackData = {
    score: 4.5,
    series: [60, 30, 10],
    labels: ['Excellent', 'Good', 'Poor'],
    colors: ['#4CAF50', '#FFC107', '#F44336'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FeedbackWidgetComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        importProvidersFrom(FeatherModule.pick(allIcons)),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackWidgetComponent);
    component = fixture.componentInstance;
    // Set required input before detecting changes
    component.feedbackData = mockFeedbackData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
