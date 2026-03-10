
-- 1. Create plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    max_slots INTEGER NOT NULL,
    monthly_price_cents INTEGER NOT NULL
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON public.plans FOR SELECT USING (true);

-- 2. Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    plan_id UUID REFERENCES public.plans(id),
    additional_slots INTEGER DEFAULT 0,
    current_period_end TIMESTAMPTZ
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.user_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Create slot availability check function
CREATE OR REPLACE FUNCTION public.check_slot_availability()
RETURNS TRIGGER AS $$
DECLARE
    v_max_slots INTEGER;
    v_current_count INTEGER;
BEGIN
    SELECT (p.max_slots + COALESCE(s.additional_slots, 0)) INTO v_max_slots
    FROM public.user_subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.user_id = NEW.user_id;

    IF v_max_slots IS NULL THEN
        RAISE EXCEPTION 'No active subscription found. Please subscribe to track companies.';
    END IF;

    SELECT COUNT(*) INTO v_current_count
    FROM public.tracked_companies
    WHERE user_id = NEW.user_id AND is_active = true;

    IF v_current_count >= v_max_slots THEN
        RAISE EXCEPTION 'You have reached your Tracked Company limit. Please untrack a company to free up a slot.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Set the trigger
CREATE TRIGGER enforce_slot_limit
BEFORE INSERT ON public.tracked_companies
FOR EACH ROW EXECUTE FUNCTION public.check_slot_availability();

-- 5. Seed the plans
INSERT INTO public.plans (name, max_slots, monthly_price_cents) VALUES
  ('Starter', 3, 2900),
  ('Pro', 25, 25000),
  ('Team', 100, 80000);
