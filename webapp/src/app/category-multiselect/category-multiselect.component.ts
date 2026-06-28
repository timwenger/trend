import { Component, forwardRef, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
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
export class CategoryMultiselectComponent implements ControlValueAccessor, OnChanges {
  @Input() options: Category[] = [];
  @Input() placeholder: string = 'Tagged Categories';
  @Input() maxSelectedLabels: number = 1000;
  @Input() scrollHeight: string = '24rem';
  @Input() appendTo: 'body' | null = 'body';

  value: Category[] = [];
  filteredOptions: Category[] = [];
  filterText: string = '';
  disabled: boolean = false;

  private readonly categoryPanelClass = 'category-multiselect-panel';
  private onChange: (value: Category[]) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private utilityService: UtilityService) {}

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

  onFilterDelete(event: Event): void {
    event.preventDefault();
    this.clearFilter();
  }

  onFilterEscape(event: Event): void {
    event.preventDefault();
    this.clearFilter();
  }

  onFilterKeyDown(event: Event): void {
    this.utilityService.handleCategoryFilterKeyDown(event, this.categoryPanelClass);
  }

  onPanelShow(): void {
    this.utilityService.focusElement(`.${this.categoryPanelClass} .category-filter-input`);
  }

  private applyFilter(): void {
    this.filteredOptions = this.utilityService.filterCategoriesByName(this.options ?? [], this.filterText);
  }
}
