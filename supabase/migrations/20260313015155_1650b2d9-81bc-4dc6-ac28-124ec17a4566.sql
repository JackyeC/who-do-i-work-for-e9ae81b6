-- Add owner and internal_test to app_role enum for Demo Safe Mode
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'internal_test';