import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CheckInService } from './check-in.service';
import { environment } from '../../../environments/environment';

describe('CheckInService', () => {
  let service: CheckInService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [
        CheckInService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CheckInService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stopMonitoring();
    vi.useRealTimers();
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= startMonitoring =============

  it('startMonitoring() should not activate for services shorter than 60 minutes', () => {
    let status: any;
    service.checkInStatus$.subscribe(s => (status = s));

    service.startMonitoring('req-1', 30);
    expect(status.isActive).toBe(false);
  });

  it('startMonitoring() should activate for services >= 60 minutes', () => {
    let status: any;
    service.checkInStatus$.subscribe(s => (status = s));

    service.startMonitoring('req-1', 90, 30);
    expect(status.isActive).toBe(true);
    expect(status.serviceRequestId).toBe('req-1');
    expect(status.missedCheckIns).toBe(0);
    expect(status.intervalMinutes).toBe(30);
    expect(status.nextCheckInDue).toBeInstanceOf(Date);
  });

  it('startMonitoring() should use default interval of 30 minutes', () => {
    let status: any;
    service.checkInStatus$.subscribe(s => (status = s));

    service.startMonitoring('req-1', 120);
    expect(status.intervalMinutes).toBe(30);
  });

  // ============= stopMonitoring =============

  it('stopMonitoring() should reset state and clear timers', () => {
    let status: any;
    let showReminder: boolean | undefined;
    service.checkInStatus$.subscribe(s => (status = s));
    service.showReminder$.subscribe(s => (showReminder = s));

    service.startMonitoring('req-1', 120, 30);
    service.stopMonitoring();

    expect(status.isActive).toBe(false);
    expect(status.serviceRequestId).toBeNull();
    expect(status.nextCheckInDue).toBeNull();
    expect(status.missedCheckIns).toBe(0);
    expect(showReminder).toBe(false);
  });

  // ============= checkIn =============

  it('checkIn() should POST to /tracking/:id/check-in', () => {
    service.startMonitoring('req-1', 120, 30);

    service.checkIn('Estoy bien').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/tracking/req-1/check-in`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'Estoy bien' });
    req.flush({ success: true, nextCheckInDue: new Date().toISOString(), missedCheckIns: 0 });
  });

  it('checkIn() should use default message when none provided', () => {
    service.startMonitoring('req-1', 120, 30);

    service.checkIn().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/tracking/req-1/check-in`);
    expect(req.request.body.message).toBe('Check-in manual');
    req.flush({ success: true, nextCheckInDue: new Date().toISOString(), missedCheckIns: 0 });
  });

  it('checkIn() should throw if no active service', () => {
    expect(() => service.checkIn()).toThrow('No active service for check-in');
  });

  it('checkIn() should reset missed count and hide reminder on success', () => {
    let status: any;
    let showReminder: boolean | undefined;
    service.checkInStatus$.subscribe(s => (status = s));
    service.showReminder$.subscribe(s => (showReminder = s));

    service.startMonitoring('req-1', 120, 30);

    service.checkIn().subscribe();

    const nextDue = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const req = httpMock.expectOne(`${apiUrl}/tracking/req-1/check-in`);
    req.flush({ success: true, nextCheckInDue: nextDue, missedCheckIns: 0 });

    expect(status.missedCheckIns).toBe(0);
    expect(showReminder).toBe(false);
  });

  // ============= dismissReminder =============

  it('dismissReminder() should hide reminder', () => {
    let showReminder: boolean | undefined;
    service.showReminder$.subscribe(s => (showReminder = s));

    service.startMonitoring('req-1', 120, 30);
    service.dismissReminder();

    expect(showReminder).toBe(false);
  });

  it('dismissReminder() should trigger missed check-in after timeout', () => {
    let status: any;
    service.checkInStatus$.subscribe(s => (status = s));

    service.startMonitoring('req-1', 120, 30);
    service.dismissReminder();

    // Advance 5 minutes (REMINDER_TIMEOUT_MINUTES)
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(status.missedCheckIns).toBe(1);
  });

  // ============= Timer-based reminder =============

  it('should show reminder when check-in is due', () => {
    let showReminder: boolean | undefined;
    service.showReminder$.subscribe(s => (showReminder = s));

    service.startMonitoring('req-1', 120, 30);

    // Advance 30 minutes to trigger the reminder
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(showReminder).toBe(true);
  });

  // ============= getRemainingTime =============

  it('getRemainingTime() should return 0 when no active monitoring', () => {
    expect(service.getRemainingTime()).toBe(0);
  });

  it('getRemainingTime() should return remaining ms until next check-in', () => {
    service.startMonitoring('req-1', 120, 30);

    // At start, remaining should be ~30 minutes
    const remaining = service.getRemainingTime();
    expect(remaining).toBe(30 * 60 * 1000);
  });

  it('getRemainingTime() should decrease as time passes', () => {
    service.startMonitoring('req-1', 120, 30);

    vi.advanceTimersByTime(10 * 60 * 1000); // 10 minutes

    const remaining = service.getRemainingTime();
    // Should be ~20 minutes remaining
    expect(remaining).toBe(20 * 60 * 1000);
  });

  // ============= formatRemainingTime =============

  it('formatRemainingTime() should return MM:SS format', () => {
    service.startMonitoring('req-1', 120, 30);

    const formatted = service.formatRemainingTime();
    expect(formatted).toBe('30:00');
  });

  it('formatRemainingTime() should return 00:00 when no active monitoring', () => {
    expect(service.formatRemainingTime()).toBe('00:00');
  });

  it('formatRemainingTime() should show correct time after partial elapsed', () => {
    service.startMonitoring('req-1', 120, 30);

    // Advance 25 minutes and 30 seconds
    vi.advanceTimersByTime(25 * 60 * 1000 + 30 * 1000);

    const formatted = service.formatRemainingTime();
    expect(formatted).toBe('04:30');
  });
});
