import { supabase } from '../lib/supabase';
import type { Ticket } from '../types';

export async function fetchTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('departure_date', { ascending: true })
    .order('departure_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchTicket(id: string): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createTicket(
  ticket: Omit<Ticket, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Ticket> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('用户未登录');

  const { data, error } = await supabase
    .from('tickets')
    .insert({ ...ticket, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTicket(
  id: string,
  ticket: Partial<Ticket>
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .update(ticket)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTicket(id: string): Promise<void> {
  const { error } = await supabase.from('tickets').delete().eq('id', id);

  if (error) throw error;
}
