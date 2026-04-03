CREATE TABLE public.email_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  email_type text NOT NULL,
  email_month text,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id, email_type, email_month)
);
