ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;