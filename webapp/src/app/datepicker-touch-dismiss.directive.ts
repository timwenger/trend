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
  }
}
