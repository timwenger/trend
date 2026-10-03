export type RecurringStatusFilter = 'Posted' | 'NonRecurring' | 'Pending' | 'Accepted' | 'Skipped';

export interface TransactionFilters {
	dateFilter: boolean;
	dateOldest: string;
	dateLatest: string;
	categoryFilter: boolean;
	selectedCategoryIds: string[];
	searchText?: string;
	match?: 'All' | 'Any';
	recurringStatus: RecurringStatusFilter;
}