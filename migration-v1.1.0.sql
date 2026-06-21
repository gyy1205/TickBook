-- TickBook v1.1.0 数据库迁移
-- 在 Supabase SQL Editor 中运行此文件

-- v1.0 已执行的内容：
-- ALTER TABLE tickets ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'none';

-- v1.1 新增字段：
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS gate_info VARCHAR(50) DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS departure_station_en VARCHAR(50) DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS arrival_station_en VARCHAR(50) DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passenger_id VARCHAR(30) DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS service_text TEXT DEFAULT '买票请到12306\n发货请到95306';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS qr_content TEXT DEFAULT '';
