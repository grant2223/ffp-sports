-- Holds gear for a booking only if every item is still free for the dates. One booking at a time, so two
-- requests made at the same moment can never book the same unit.
create or replace function public.hold_gear(p_booking uuid, p_from date, p_to date, p_items jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare it jsonb; f int; nm text;
begin
  perform pg_advisory_xact_lock(hashtext('ffps_gear_holds'));
  for it in select * from jsonb_array_elements(p_items) loop
    select free into f from gear_free(p_from, p_to) where gear_id = it->>'gear_id';
    if coalesce(f, 0) < (it->>'qty')::int then
      select name into nm from gear where id = it->>'gear_id';
      return 'Only ' || greatest(coalesce(f, 0), 0) || ' ' || coalesce(nm, 'of that item') || ' left for those dates';
    end if;
  end loop;
  insert into gear_holds (booking_id, gear_id, qty, date_from, date_to)
    select p_booking, x->>'gear_id', (x->>'qty')::int, p_from, p_to from jsonb_array_elements(p_items) x;
  return null;
end $$;
revoke execute on function public.hold_gear(uuid, date, date, jsonb) from public, anon, authenticated;
