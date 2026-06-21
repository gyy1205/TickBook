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
  gate_info: string;
  departure_station_en: string;
  arrival_station_en: string;
  is_student: boolean;
  passenger_id: string;
  service_text: string;
  qr_content: string;
  template?: string;
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
  gate_info: '检票口：',
  departure_station_en: '',
  arrival_station_en: '',
  is_student: false,
  passenger_id: '',
  service_text: '买票请到12306 发货请到95306\n中国铁路祝您旅途愉快',
  qr_content: '',
};
