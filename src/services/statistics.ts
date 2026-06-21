import type { Ticket } from '../types';
import {
  sumPrice,
  calcTotalDuration,
  countUniqueStations,
  groupByMonth,
  groupByTrainClass,
  topStations,
} from '../utils/statCalc';

export interface StatisticsData {
  totalCount: number;
  totalSpending: number;
  stationCount: number;
  totalDuration: { hours: number; minutes: number };
  byType: { type: string; label: string; count: number; total: number }[];
  byMonth: { month: string; count: number; total: number }[];
  topStations: { name: string; count: number }[];
}

export function computeStatistics(tickets: Ticket[]): StatisticsData {
  return {
    totalCount: tickets.length,
    totalSpending: sumPrice(tickets),
    stationCount: countUniqueStations(tickets).count,
    totalDuration: calcTotalDuration(tickets),
    byType: groupByTrainClass(tickets),
    byMonth: groupByMonth(tickets),
    topStations: topStations(tickets, 10),
  };
}
