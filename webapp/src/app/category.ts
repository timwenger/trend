export interface Category extends NewCategory {
	id: string;
	isInactive: boolean;
}

export interface NewCategory {
	categoryName: string;
	isIncome: boolean;
}