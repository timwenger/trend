import { Category } from './category';

export interface Transaction extends NewTransaction {
	id: string;
	recurringStatus?: 'NonRecurring' | 'Pending' | 'Accepted' | 'Skipped';
	transactionRuleId?: string;
	scheduledOccurrenceDate?: Date;
}

export interface NewTransaction {
	dateTimeWhenRecorded: Date;
	dateOfTransaction: Date;
	amount: number;
	transactionDescription: string;
	categories: Category[];
}