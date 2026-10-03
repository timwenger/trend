import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface Category extends NewCategory {
	id: string;
	isInactive: boolean;
}

export interface NewCategory {
	categoryName: string;
	isIncome: boolean | null;
	isPinned: boolean;
}

export function compareCategories(c1: Category, c2: Category): number {
	if (c1.isPinned !== c2.isPinned) {
		return c1.isPinned ? -1 : 1;
	}

	return c1.categoryName.localeCompare(c2.categoryName);
}

export function compareManagedCategories(c1: Category, c2: Category): number {
	const pinnedComparison = Number(c2.isPinned) - Number(c1.isPinned);
	if (pinnedComparison !== 0) {
		return pinnedComparison;
	}

	const typeComparison = getCategoryTypeSortOrder(c1) - getCategoryTypeSortOrder(c2);
	if (typeComparison !== 0) {
		return typeComparison;
	}

	return c1.categoryName.localeCompare(c2.categoryName);
}

function getCategoryTypeSortOrder(category: Category): number {
	return category.isIncome === null ? 0 : category.isIncome ? 1 : 2;
}

export function getCategorySelectionError(categories: Category[] | null | undefined): string | null {
	if (!categories?.length) {
		return 'Select at least one category.';
	}

	const hasIncome = categories.some(category => category.isIncome === true);
	const hasExpense = categories.some(category => category.isIncome === false);
	if (hasIncome && hasExpense) {
		return 'Income and Expense categories cannot be combined.';
	}
	if (!hasIncome && !hasExpense) {
		return 'An Either category must be accompanied by an Income or Expense category.';
	}

	return null;
}

export function categorySelectionValidator(): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const categories = control.value as Category[] | null;
		if (!categories?.length) {
			return null;
		}

		const message = getCategorySelectionError(categories);
		return message ? { categorySelection: { message } } : null;
	};
}

export function getCategoryTransactionType(categories: Category[]): boolean | null {
	return categories.find(category =>
		category.isIncome === true || category.isIncome === false
	)?.isIncome ?? null;
}