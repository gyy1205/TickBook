-- TickBook 数据库初始化 SQL
-- 在 Supabase SQL Editor 中运行以下语句

-- 1. 创建 tickets 表
CREATE TABLE tickets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_type     VARCHAR(20)  DEFAULT 'train' CHECK (ticket_type IN ('train', 'reimbursement')),
  train_number    VARCHAR(20)  DEFAULT '',
  departure_station VARCHAR(50) DEFAULT '',
  arrival_station VARCHAR(50)  DEFAULT '',
  departure_date  DATE         DEFAULT NULL,
  departure_time  VARCHAR(10)  DEFAULT '',
  arrival_time    VARCHAR(10)  DEFAULT '',
  seat_class      VARCHAR(20)  DEFAULT '二等座',
  carriage_no     VARCHAR(10)  DEFAULT '',
  seat_no         VARCHAR(10)  DEFAULT '',
  passenger_name  VARCHAR(50)  DEFAULT '',
  price           DECIMAL(10,2) DEFAULT 0,
  serial_number   VARCHAR(50)  DEFAULT '',
  notes              TEXT         DEFAULT '',
  gate_info          VARCHAR(50)  DEFAULT '',
  departure_station_en VARCHAR(50) DEFAULT '',
  arrival_station_en  VARCHAR(50) DEFAULT '',
  is_student         BOOLEAN      DEFAULT false,
  passenger_id       VARCHAR(30)  DEFAULT '',
  template           VARCHAR(50)  DEFAULT 'none',
  image_url       TEXT         DEFAULT '',
  created_at      TIMESTAMPTZ  DEFAULT now(),
  updated_at      TIMESTAMPTZ  DEFAULT now()
);

-- 2. 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. 启用 Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略：用户只能操作自己的票据
CREATE POLICY "Users can read own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tickets"
  ON tickets FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 创建索引
CREATE INDEX tickets_user_id_idx ON tickets(user_id);
CREATE INDEX tickets_created_at_idx ON tickets(created_at DESC);
