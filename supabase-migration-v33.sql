-- ============================================================================
-- MIGRATION v33 — KẾ HOẠCH THEO NGÀNH HÀNG CHỦ LỰC
-- Thêm cột JSONB lưu ma trận ngành hàng (SL + doanh thu dự kiến + chiến lược)
-- vào bảng kế hoạch. An toàn chạy lại nhiều lần.
-- ============================================================================
ALTER TABLE crm_plans ADD COLUMN IF NOT EXISTS nganh_hang JSONB;
SELECT 'v33 OK — crm_plans.nganh_hang sẵn sàng' AS ket_qua;
