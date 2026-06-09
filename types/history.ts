import { Analysis } from './analysis';

export type ScanRecord = {
  id: string;
  date: string; // ISO 8601
  analysis: Analysis;
};
