import { Category } from './category';

export interface Transaction extends NewTransaction {
	id: string;
}

export interface NewTransaction {
	dateTimeWhenRecorded: string;
	dateOfTransaction: string;
	amount: number;
	transactionDescription: string;
	categories: Category[];
}