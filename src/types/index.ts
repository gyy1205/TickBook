export interface Ticket {
  id?: string;
  user_id?: string;
  ticket_type: 'train' | 'reimbursement';
  train_number: string;
  departure_station: string;
  arrival_station: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  seat_class: string;
  carriage_no: string;
  seat_no: string;
  passenger_name: string;
  price: number;
  serial_number: string;
  notes: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const emptyTicket: Ticket = {
  ticket_type: 'train',
  train_number: '',
  departure_station: '',
  arrival_station: '',
  departure_date: '',
  departure_time: '',
  arrival_time: '',
  seat_class: '二等座',
  carriage_no: '',
  seat_no: '',
  passenger_name: '',
  price: 0,
  serial_number: '',
  notes: '',
};
