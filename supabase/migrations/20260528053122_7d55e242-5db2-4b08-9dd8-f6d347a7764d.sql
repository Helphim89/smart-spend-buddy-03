
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly INTEGER NOT NULL DEFAULT 15000,
  weekday INTEGER NOT NULL DEFAULT 1500,
  weekend INTEGER NOT NULL DEFAULT 1500,
  other INTEGER NOT NULL DEFAULT 4000,
  payday INTEGER NOT NULL DEFAULT 27,
  user1 TEXT NOT NULL DEFAULT 'Matilda',
  user2 TEXT NOT NULL DEFAULT 'Jonathan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Övrigt',
  user_name TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX purchases_household_date_idx ON public.purchases(household_id, date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO anon, authenticated;
GRANT ALL ON public.households TO service_role;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hh_select" ON public.households FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "hh_insert" ON public.households FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "hh_update" ON public.households FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "p_select" ON public.purchases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "p_insert" ON public.purchases FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "p_update" ON public.purchases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_delete" ON public.purchases FOR DELETE TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.households;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
ALTER TABLE public.households REPLICA IDENTITY FULL;
ALTER TABLE public.purchases  REPLICA IDENTITY FULL;
