export interface TransactionFilters {
	dateFilter: boolean;
	dateOldest: string;
	dateLatest: string;
	categoryFilter: boolean;
	selectedCategoryIds: string[];
}