import { Directive, ElementRef, HostListener } from '@angular/core';
import { DatePicker } from 'primeng/datepicker';

@Directive({
  selector: 'p-datepicker',
})
export class DatePickerTouchDismissDirective {
  constructor(
    private readonly datePicker: DatePicker,
    private readonly elementRef: ElementRef<HTMLElement>,
  ) {}

  @HostListener('touchstart')
  preventMobileKeyboard(): void {
    if (!window.matchMedia('(max-width: 768px)').matches) {
      return;
    }

    const input = this.getInput();
    if (input) {
      input.readOnly = true;
      input.inputMode = 'none';
      input.blur();
    }
  }

  @HostListener('document:touchstart', ['$event'])
  dismissOnOutsideTouch(event: TouchEvent): void {
    if (!this.datePicker.overlayVisible()) {
      return;
    }

    const target = event.target as Node | null;
    if (
      !target ||
      this.elementRef.nativeElement.contains(target) ||
      this.datePicker.overlay?.contains(target)
    ) {
      return;
    }

    this.datePicker.hideOverlay();
    this.blurInput();
  }

  @HostListener('document:touchend')
  blurClosedCalendarInput(): void {
    if (
      window.matchMedia('(max-width: 768px)').matches &&
      !this.datePicker.overlayVisible()
    ) {
      this.blurInput();
    }
  }

  private blurInput(): void {
    this.getInput()?.blur();
  }

  private getInput(): HTMLInputElement | null {
    return this.elementRef.nativeElement.querySelector('input');
  }
}
