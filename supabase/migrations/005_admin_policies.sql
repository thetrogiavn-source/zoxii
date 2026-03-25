-- Admin RLS policies for update operations
-- Run this in Supabase SQL Editor

-- Admin can update withdrawals
CREATE POLICY "Admins can update withdrawals" ON public.withdrawals
  FOR UPDATE USING (public.is_admin());

-- Admin can update profiles (change tier, KYC status)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Admin can insert transactions (webhook uses service role, but just in case)
CREATE POLICY "Admins can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (public.is_admin());

-- Admin can update transactions
CREATE POLICY "Admins can update transactions" ON public.transactions
  FOR UPDATE USING (public.is_admin());
