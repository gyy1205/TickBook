import type { Ticket } from '../types';
import {
  sumPrice,
  calcTotalDuration,
  countUniqueStations,
  groupByMonth,
  groupByTrainClass,
  topStations,
  groupBySeatPosition,
  groupByEMUSeat,
  groupByBerth,
} from '../utils/statCalc';
import type { SeatPositionStats, EMUSeatStats, BerthStats } from '../utils/statCalc';

export interface StatisticsData {
  totalCount: number;
  totalSpending: number;
  stationCount: number;
  totalDuration: { hours: number; minutes: number };
  byType: { type: string; label: string; count: number; total: number }[];
  byMonth: { month: string; count: number; total: number }[];
  topStations: { name: string; count: number }[];
  seatPosition: SeatPositionStats;
  emuSeat: EMUSeatStats;
  berth: BerthStats;
}

export function computeStatistics(tickets: Ticket[]): StatisticsData {
  const travelTickets = tickets.filter((t) => t.ticket_type !== 'reimbursement_no_travel');
  return {
    totalCount: tickets.length,
    totalSpending: sumPrice(tickets),
    stationCount: countUniqueStations(travelTickets).count,
    totalDuration: calcTotalDuration(travelTickets),
    byType: groupByTrainClass(tickets),
    byMonth: groupByMonth(tickets),
    topStations: topStations(travelTickets, 10),
    seatPosition: groupBySeatPosition(tickets),
    emuSeat: groupByEMUSeat(tickets),
    berth: groupByBerth(tickets),
  };
}
