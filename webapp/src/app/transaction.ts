import { Category } from './category';

export interface Transaction extends NewTransaction {
	id: number;
	category: Category;
}

export interface NewTransaction {
	dateTimeWhenRecorded: string;
	dateOfTransaction: string;
	amount: number;
	transactionDescription: string;
	categoryId: number;
}