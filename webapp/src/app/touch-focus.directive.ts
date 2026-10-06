import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'input[pInputText], textarea',
})
export class TouchFocusDirective {
  constructor(
    private readonly elementRef: ElementRef<HTMLInputElement | HTMLTextAreaElement>,
  ) {}

  @HostListener('touchstart')
  focusOnTouch(): void {
    const input = this.elementRef.nativeElement;
    if (!input.disabled && !input.readOnly) {
      input.focus({ preventScroll: true });
    }
  }
}
