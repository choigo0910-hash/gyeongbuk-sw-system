-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  total_amount INTEGER,
  note TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget items table
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  detail TEXT NOT NULL,
  item TEXT,
  description TEXT,
  quantity INTEGER,
  unit_price INTEGER,
  amount INTEGER NOT NULL,
  sort_order INTEGER,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget changes table
CREATE TABLE budget_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  total_amount INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: budgets
CREATE POLICY "Company users can view own budgets"
ON budgets FOR SELECT TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all budgets"
ON budgets FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Company users can insert own budgets"
ON budgets FOR INSERT TO authenticated WITH CHECK (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "Company users can update own budgets"
ON budgets FOR UPDATE TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- RLS Policies: budget_items
CREATE POLICY "Users can view items for accessible budgets"
ON budget_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_items.budget_id
    AND (
      budgets.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
      )
    )
  )
);

CREATE POLICY "Users can insert items for own budgets"
ON budget_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_items.budget_id
    AND budgets.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can update items for own budgets"
ON budget_items FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_items.budget_id
    AND budgets.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
  )
);

-- RLS Policies: budget_changes
CREATE POLICY "Users can view changes for accessible budgets"
ON budget_changes FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_changes.budget_id
    AND (
      budgets.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
      )
    )
  )
);

-- Indexes
CREATE INDEX idx_budgets_company ON budgets(company_id);
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX idx_budget_changes_budget ON budget_changes(budget_id);

-- Updated at trigger for budgets
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budgets_updated_at
BEFORE UPDATE ON budgets FOR EACH ROW
EXECUTE FUNCTION update_budgets_updated_at();

-- Updated at trigger for budget_items
CREATE OR REPLACE FUNCTION update_budget_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_items_updated_at
BEFORE UPDATE ON budget_items FOR EACH ROW
EXECUTE FUNCTION update_budget_items_updated_at();
