export interface Category extends NewCategory {
	id: number;
}

export interface NewCategory {
	categoryName: string;
	expenseOrIncome: string;
}

// Format of Categories as they come from the backend
export interface DbCategory extends NewDbCategory{
	id: number
}

export interface NewDbCategory{
	categoryName: string;
	isIncome: boolean;
}