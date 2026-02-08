import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { ImageCompressionService } from './image-compression.service';

describe('ImageCompressionService', () => {
  let service: ImageCompressionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImageCompressionService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= calculateDimensions (private, tested via cast) =============

  describe('calculateDimensions', () => {
    let calcDims: (origW: number, origH: number, maxW: number, maxH: number) => { width: number; height: number };

    beforeEach(() => {
      calcDims = (service as any).calculateDimensions.bind(service);
    });

    it('should scale down width-limited landscape image', () => {
      // 2000x1000 with max 1200x1200 => scale by width: 1200x600
      expect(calcDims(2000, 1000, 1200, 1200)).toEqual({ width: 1200, height: 600 });
    });

    it('should scale down height-limited portrait image', () => {
      // 1000x2000 with max 1200x1200 => scale by height: 600x1200
      expect(calcDims(1000, 2000, 1200, 1200)).toEqual({ width: 600, height: 1200 });
    });

    it('should not resize image smaller than max dimensions', () => {
      expect(calcDims(800, 600, 1200, 1200)).toEqual({ width: 800, height: 600 });
    });

    it('should handle image at exact max dimensions', () => {
      expect(calcDims(1200, 1200, 1200, 1200)).toEqual({ width: 1200, height: 1200 });
    });

    it('should scale down image exceeding both dimensions', () => {
      // 2400x1800 with max 1200x1200
      // First scale by width: 1200x900 (both within limits)
      expect(calcDims(2400, 1800, 1200, 1200)).toEqual({ width: 1200, height: 900 });
    });

    it('should handle very tall image needing double scale', () => {
      // 2000x4000, max 1200x1200
      // Scale by width: 1200x2400, still exceeds height
      // Scale by height: 600x1200
      expect(calcDims(2000, 4000, 1200, 1200)).toEqual({ width: 600, height: 1200 });
    });
  });

  // ============= isWebPSupported / getOptimalFormat =============

  it('isWebPSupported() should return a boolean', () => {
    // Mock canvas.toDataURL since jsdom doesn't implement canvas
    const mockToDataURL = vi.fn().mockReturnValue('data:image/webp;base64,');
    const spy = vi.spyOn(document, 'createElement').mockReturnValue({ toDataURL: mockToDataURL } as any);

    const result = service.isWebPSupported();
    expect(typeof result).toBe('boolean');

    spy.mockRestore();
  });

  it('getOptimalFormat() should return webp or jpeg', () => {
    // Mock canvas to support webp
    const mockToDataURL = vi.fn().mockReturnValue('data:image/webp;base64,');
    const spy = vi.spyOn(document, 'createElement').mockReturnValue({ toDataURL: mockToDataURL } as any);

    const format = service.getOptimalFormat();
    expect(['webp', 'jpeg']).toContain(format);

    spy.mockRestore();
  });

  it('getOptimalFormat() should return jpeg when webp is not supported', () => {
    // Mock canvas that doesn't support webp (returns data:, for unsupported formats)
    const mockToDataURL = vi.fn().mockReturnValue('data:,');
    const spy = vi.spyOn(document, 'createElement').mockReturnValue({ toDataURL: mockToDataURL } as any);

    const format = service.getOptimalFormat();
    expect(format).toBe('jpeg');

    spy.mockRestore();
  });
});
