import { Category } from './category';

export interface Transaction {
	id: number;
	dateTimeWhenRecorded: string;
	dateOfTransaction: string;
	amount: number;
	transactionDescription: string;
	categoryId: number;
	category: Category;
  }