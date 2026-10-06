import { ElementRef } from '@angular/core';
import { TouchFocusDirective } from './touch-focus.directive';

describe('TouchFocusDirective', () => {
  it('focuses editable controls on touch', () => {
    const input = document.createElement('input');
    const focus = vi.spyOn(input, 'focus');
    const directive = new TouchFocusDirective(new ElementRef(input));

    directive.focusOnTouch();

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('does not focus read-only controls', () => {
    const input = document.createElement('input');
    input.readOnly = true;
    const focus = vi.spyOn(input, 'focus');
    const directive = new TouchFocusDirective(new ElementRef(input));

    directive.focusOnTouch();

    expect(focus).not.toHaveBeenCalled();
  });
});
