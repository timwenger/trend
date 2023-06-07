export interface Category extends NewCategory {
	id: string;
}

export interface NewCategory {
	categoryName: string;
	isIncome: boolean;
}