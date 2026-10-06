import '@angular/compiler';
import { ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../api.service';
import { TrendAggregationService } from '../trend-aggregation.service';
import { TrendsComponent } from './trends.component';

describe('TrendsComponent mobile chart gestures', () => {
  let component: TrendsComponent;

  beforeEach(() => {
    component = new TrendsComponent(
      {} as ApiService,
      new TrendAggregationService(),
      { markForCheck: vi.fn() } as unknown as ChangeDetectorRef,
    );
    component.chart1Start = new Date(2026, 8, 1);
    component.chart1End = new Date(2026, 9, 1);
  });

  it('leaves vertical chart gestures to native page scrolling', () => {
    component.onChartScrubStart(1, pointerEvent('pointerdown', 100, 100), true);
    const move = pointerEvent('pointermove', 102, 125);

    component.onGlobalPointerMove(move, true);

    expect(move.preventDefault).not.toHaveBeenCalled();
    expect((component as any).scrubPendingChart).toBeNull();
    expect((component as any).activeScrubChart).toBeNull();
  });

  it('activates chart scrubbing for horizontal gestures', () => {
    component.onChartScrubStart(1, pointerEvent('pointerdown', 100, 100), true);
    const activateScrub = vi.spyOn(component as any, 'activateScrub');
    const move = pointerEvent('pointermove', 120, 102);

    component.onGlobalPointerMove(move, true);

    expect(move.preventDefault).toHaveBeenCalled();
    expect(activateScrub).toHaveBeenCalledWith(1);
  });
});

function pointerEvent(type: string, clientX: number, clientY: number): PointerEvent {
  return {
    type,
    clientX,
    clientY,
    currentTarget: {
      clientWidth: 320,
      querySelector: () => null,
    },
    preventDefault: vi.fn(),
  } as unknown as PointerEvent;
}
