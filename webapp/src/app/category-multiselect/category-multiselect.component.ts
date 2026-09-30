import { AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { Category } from '../category';
import { UtilityService } from '../utility.service';

@Component({
  selector: 'app-category-multiselect',
  templateUrl: './category-multiselect.component.html',
  styleUrls: ['./category-multiselect.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryMultiselectComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class CategoryMultiselectComponent implements AfterViewInit, ControlValueAccessor, OnChanges, OnDestroy {
  @ViewChild('multiSelect') private multiSelect!: MultiSelect;

  @Input() options: Category[] = [];
  @Input() placeholder: string = 'Tagged Categories';
  @Input() maxSelectedLabels: number = 1000;
  @Input() scrollHeight: string = '24rem';
  @Input() appendTo: 'body' | null = 'body';
  @Output() shortcutSubmit = new EventEmitter<void>();

  value: Category[] = [];
  filteredOptions: Category[] = [];
  filterText: string = '';
  showInactive: boolean = false;
  disabled: boolean = false;
  mobileFilterReadOnly: boolean = window.matchMedia('(max-width: 768px)').matches;

  private readonly categoryPanelClass = 'category-multiselect-panel';
  private readonly captureCtrlEnter = (event: KeyboardEvent): void => {
    if (!this.shortcutSubmit.observed || !event.ctrlKey || event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.shortcutSubmit.emit();
  };
  private onChange: (value: Category[]) => void = () => {};
  onTouched: () => void = () => {};

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private utilityService: UtilityService
  ) {}

  ngAfterViewInit(): void {
    this.elementRef.nativeElement.addEventListener('keydown', this.captureCtrlEnter, true);
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('keydown', this.captureCtrlEnter, true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.applyFilter();
    }
  }

  writeValue(value: Category[] | null): void {
    this.value = value ?? [];
  }

  registerOnChange(fn: (value: Category[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(value: Category[]): void {
    this.value = value ?? [];
    this.onChange(this.value);
  }

  onFilterInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.filterText = input?.value ?? '';
    this.applyFilter();
  }

  clearFilter(): void {
    this.filterText = '';
    this.applyFilter();
  }

  toggleInactive(event: Event): void {
    event.stopPropagation();
    this.showInactive = !this.showInactive;
    this.applyFilter();
  }

  onFilterDelete(event: Event): void {
    this.onFilterDismissKey(event);
  }

  onFilterEscape(event: Event): void {
    this.onFilterDismissKey(event);
  }

  private onFilterDismissKey(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.filterText) {
      this.clearFilter();
    } else {
      this.multiSelect.hide(true);
    }
  }

  onFilterKeyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.ctrlKey && keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      this.shortcutSubmit.emit();
      return;
    }

    this.utilityService.handleCategoryFilterKeyDown(event, this.categoryPanelClass);
  }

  prepareMobilePanel(): void {
    if (window.matchMedia('(max-width: 768px)').matches) {
      this.mobileFilterReadOnly = true;
      this.disableMobileTriggerInput();
    }
  }

  onPanelShow(): void {
    if (window.matchMedia('(max-width: 768px)').matches) {
      this.mobileFilterReadOnly = true;
      this.disableMobileTriggerInput();
      setTimeout(() => {
        const input = document.querySelector(
          `.${this.categoryPanelClass} .category-filter-input`
        ) as HTMLInputElement | null;
        if (input) {
          input.readOnly = true;
          input.inputMode = 'none';
        }
        input?.blur();
        this.disableMobileTriggerInput();
      });
    } else {
      this.utilityService.focusElement(`.${this.categoryPanelClass} .category-filter-input`);
    }
  }

  enableMobileFilter(event: Event): void {
    if (window.matchMedia('(max-width: 768px)').matches) {
      event.stopPropagation();
      this.mobileFilterReadOnly = false;
      const input = event.currentTarget as HTMLInputElement | null;
      if (input) {
        const wasReadOnly = this.multiSelect.readonly;
        if (event.type === 'click') {
          this.multiSelect.readonly = true;
        }
        input.readOnly = false;
        input.inputMode = 'search';
        input.focus();
        if (event.type === 'click') {
          setTimeout(() => {
            this.multiSelect.readonly = wasReadOnly;
          }, 0);
        }
      }
    }
  }

  onPanelHide(): void {
    this.mobileFilterReadOnly = window.matchMedia('(max-width: 768px)').matches;
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.multiSelect?.overlayVisible || !window.matchMedia('(max-width: 768px)').matches) {
      return;
    }

    const target = event.target as Node | null;
    const panel = document.querySelector(`.${this.categoryPanelClass}`);
    if (target && !this.elementRef.nativeElement.contains(target) && !panel?.contains(target)) {
      this.utilityService.markCategoryOverlayDismissal(event.pointerId);
    }
  }

  @HostListener('document:pointerup', ['$event'])
  onDocumentPointerUp(event: PointerEvent): void {
    this.utilityService.clearCategoryOverlayDismissal(event.pointerId);
  }

  private disableMobileTriggerInput(): void {
    const triggerInput = this.elementRef.nativeElement.querySelector<HTMLInputElement>(
      'input[data-pc-section="hiddeninput"]'
    );
    if (triggerInput) {
      triggerInput.readOnly = true;
      triggerInput.inputMode = 'none';
      triggerInput.blur();
    }
  }

  private applyFilter(): void {
    const matchingOptions = this.utilityService.filterCategoriesByName(this.options ?? [], this.filterText);
    const activeOptions = matchingOptions.filter(category => !category.isInactive);
    const inactiveOptions = matchingOptions.filter(category => category.isInactive);
    this.filteredOptions = this.showInactive
      ? [...activeOptions, ...inactiveOptions]
      : activeOptions;
  }
}
