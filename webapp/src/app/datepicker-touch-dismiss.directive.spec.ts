import { ElementRef } from '@angular/core';
import { DatePickerTouchDismissDirective } from './datepicker-touch-dismiss.directive';

describe('DatePickerTouchDismissDirective', () => {
  it('closes an open calendar when a touch starts outside it', () => {
    const host = document.createElement('div');
    const overlay = document.createElement('div');
    const outside = document.createElement('div');
    const hideOverlay = vi.fn();
    const directive = new DatePickerTouchDismissDirective(
      {
        overlayVisible: () => true,
        overlay,
        hideOverlay,
      } as never,
      new ElementRef(host),
    );

    directive.dismissOnOutsideTouch({ target: outside } as unknown as TouchEvent);

    expect(hideOverlay).toHaveBeenCalledOnce();
  });

  it('keeps an open calendar visible when touched inside its overlay', () => {
    const host = document.createElement('div');
    const overlay = document.createElement('div');
    const date = document.createElement('button');
    overlay.appendChild(date);
    const hideOverlay = vi.fn();
    const directive = new DatePickerTouchDismissDirective(
      {
        overlayVisible: () => true,
        overlay,
        hideOverlay,
      } as never,
      new ElementRef(host),
    );

    directive.dismissOnOutsideTouch({ target: date } as unknown as TouchEvent);

    expect(hideOverlay).not.toHaveBeenCalled();
  });
});
