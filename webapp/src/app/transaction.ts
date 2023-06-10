import { Category } from './category';

export interface Transaction extends NewTransaction {
	id: string;
}

export interface NewTransaction {
	dateTimeWhenRecorded: Date;
	dateOfTransaction: Date;
	amount: number;
	transactionDescription: string;
	categories: Category[];
}