import { ElementRef } from '@angular/core';
import { DatePickerTouchDismissDirective } from './datepicker-touch-dismiss.directive';

describe('DatePickerTouchDismissDirective', () => {
  it('makes the calendar input non-editable before mobile touch focus', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
    });
    const host = document.createElement('div');
    const input = document.createElement('input');
    const blur = vi.spyOn(input, 'blur');
    host.appendChild(input);
    const directive = new DatePickerTouchDismissDirective(
      {} as never,
      new ElementRef(host),
    );

    directive.preventMobileKeyboard();

    expect(input.readOnly).toBe(true);
    expect(input.inputMode).toBe('none');
    expect(blur).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

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

  it('blurs the calendar input after the calendar closes on mobile', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
    });
    const host = document.createElement('div');
    const input = document.createElement('input');
    const blur = vi.spyOn(input, 'blur');
    host.appendChild(input);
    const directive = new DatePickerTouchDismissDirective(
      {
        overlayVisible: () => false,
      } as never,
      new ElementRef(host),
    );

    directive.blurClosedCalendarInput();

    expect(blur).toHaveBeenCalled();
    vi.unstubAllGlobals();
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
