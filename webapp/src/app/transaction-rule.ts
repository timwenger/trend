import { Category } from './category';

export interface TransactionRuleConfig {
  startDate: Date;
  endDate: Date | null;
  recurrenceInterval: number;
  recurrenceUnit: 'days' | 'weeks' | 'months';
  useMonthEnd: boolean;
  amount: number;
  transactionDescription: string;
  categories: Category[];
}

export interface TransactionRule extends TransactionRuleConfig {
  id: string;
  userId: string;
  dateTimeWhenRecorded: Date;
  generateFromDate: Date;
  isInactive: boolean;
}