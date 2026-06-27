import { Injectable } from '@angular/core';
import { Category } from './category';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor() { }

  getShortDate(dateStr:string){
    let d = new Date(Date.parse(dateStr));
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  }

  getLocalIsoDateTime(date: Date){
    let timeZoneOffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    return (new Date(date.getTime() - timeZoneOffset)).toISOString().slice(0, -1)
  }

  filterCategoriesByName(categories: Category[], filterText: string): Category[] {
    const normalizedFilter = filterText.trim().toLowerCase();

    if (!normalizedFilter) {
      return categories;
    }

    return categories.filter((category) =>
      category.categoryName.toLowerCase().includes(normalizedFilter)
    );
  }

  focusElement(selector: string): void {
    setTimeout(() => {
      const element = document.querySelector<HTMLElement>(selector);
      element?.focus();
    }, 0);
  }

  handleCategoryFilterKeyDown(event: Event, panelClass: string): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(keyboardEvent.key)) {
      return;
    }

    const panel = this.getFirstVisiblePanel(panelClass);
    if (!panel) {
      return;
    }

    const options = Array.from(panel.querySelectorAll<HTMLElement>('[role="option"]')).filter((option) =>
      option.getAttribute('aria-disabled') !== 'true' && !option.classList.contains('p-disabled')
    );
    if (options.length === 0) {
      keyboardEvent.preventDefault();
      return;
    }

    let activeIndex = options.findIndex((option) => option.classList.contains('category-option-active'));
    if (activeIndex < 0) {
      const activeElement = document.activeElement as HTMLElement | null;
      activeIndex = options.findIndex((option) => option === activeElement || option.contains(activeElement));
    }

    if (keyboardEvent.key === 'ArrowDown') {
      activeIndex = activeIndex < 0 ? 0 : Math.min(activeIndex + 1, options.length - 1);
      this.setActiveOption(options, activeIndex);
      keyboardEvent.preventDefault();
      return;
    }

    if (keyboardEvent.key === 'ArrowUp') {
      activeIndex = activeIndex < 0 ? options.length - 1 : Math.max(activeIndex - 1, 0);
      this.setActiveOption(options, activeIndex);
      keyboardEvent.preventDefault();
      return;
    }

    const targetIndex = activeIndex < 0 ? 0 : activeIndex;
    options[targetIndex].click();
    this.setActiveOption(options, targetIndex);
    keyboardEvent.preventDefault();
  }

  private getFirstVisiblePanel(panelClass: string): HTMLElement | null {
    const panels = Array.from(document.querySelectorAll<HTMLElement>(`.${panelClass}`));
    return panels.find((panel) => panel.offsetParent !== null) ?? null;
  }

  private setActiveOption(options: HTMLElement[], activeIndex: number): void {
    options.forEach((option, index) => {
      option.classList.toggle('category-option-active', index === activeIndex);
    });

    const activeOption = options[activeIndex];
    activeOption.focus();
    activeOption.scrollIntoView({ block: 'nearest' });
  }
}
