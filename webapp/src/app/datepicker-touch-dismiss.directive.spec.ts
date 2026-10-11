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

  it('closes an open calendar when the pointer is pressed outside it', () => {
    const host = document.createElement('div');
    const input = document.createElement('input');
    host.appendChild(input);
    const outside = document.createElement('button');
    const hideOverlay = vi.fn();
    const directive = new DatePickerTouchDismissDirective(
      {
        overlayVisible: () => true,
        overlay: document.createElement('div'),
        hideOverlay,
      } as never,
      new ElementRef(host),
    );

    directive.dismissOnOutsidePointerDown(
      { target: outside } as unknown as PointerEvent,
    );

    expect(hideOverlay).toHaveBeenCalledOnce();
  });

  it('closes an open calendar when an outside click has no pointer event', () => {
    const host = document.createElement('div');
    const outside = document.createElement('button');
    const hideOverlay = vi.fn();
    const directive = new DatePickerTouchDismissDirective(
      {
        overlayVisible: () => true,
        overlay: document.createElement('div'),
        hideOverlay,
      } as never,
      new ElementRef(host),
    );

    directive.dismissOnOutsideClick(
      { target: outside } as unknown as MouseEvent,
    );

    expect(hideOverlay).toHaveBeenCalledOnce();
  });

  it('keeps an open calendar visible when the pointer is pressed inside it', () => {
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

    directive.dismissOnOutsidePointerDown(
      { target: date } as unknown as PointerEvent,
    );

    expect(hideOverlay).not.toHaveBeenCalled();
  });

  it('removes only the datepicker trigger from the tab order when requested', () => {
    const host = document.createElement('div');
    const input = document.createElement('input');
    const button = document.createElement('button');
    host.append(input, button);
    const directive = new DatePickerTouchDismissDirective(
      {} as never,
      new ElementRef(host),
    );
    directive.skipTriggerTab = true;

    directive.ngAfterViewInit();

    expect(input.tabIndex).toBe(0);
    expect(button.tabIndex).toBe(-1);
  });
});
