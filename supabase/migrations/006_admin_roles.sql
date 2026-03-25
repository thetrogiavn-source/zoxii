-- Admin Roles System
-- Adds sub-roles for admin team members

-- Add admin_role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT NULL;

-- Admin roles:
-- 'owner'       - Full access (founder)
-- 'finance'     - View transactions, revenue, withdrawals, approve withdrawals
-- 'kyc_officer' - Review & approve KYC submissions
-- 'support'     - View sellers, transactions (read-only), respond to issues
-- 'viewer'      - Read-only access to all admin pages
-- NULL          - Not an admin team member (regular seller)

-- Create admin_team table for invitations
CREATE TABLE IF NOT EXISTS public.admin_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  admin_role TEXT NOT NULL CHECK (admin_role IN ('owner', 'finance', 'kyc_officer', 'support', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email)
);

-- RLS
ALTER TABLE public.admin_team ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view admin_team" ON public.admin_team FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage admin_team" ON public.admin_team FOR ALL USING (public.is_admin());

-- Set owner role for existing admin
UPDATE public.profiles SET admin_role = 'owner' WHERE role = 'admin';
