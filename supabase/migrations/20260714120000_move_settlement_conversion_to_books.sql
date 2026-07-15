-- 換算設定（幣別/匯率）是整批結算共用的批次屬性，原本卻存在 settlements 每一筆 row，
-- 造成同一次結算的多筆 transfer 重複同一組值、前端得靠 .find() 挑一筆代表整批。
-- 搬到 books 表：跟 settled_at 一樣是「一次結算事件」層級的欄位，1:1 對應，不再重複。
alter table public.books
  add column settlement_currency text,
  add column exchange_rate       numeric(18,6) check (exchange_rate is null or exchange_rate > 0);

update public.books b
set settlement_currency = s.settlement_currency,
    exchange_rate = s.exchange_rate
from (
  select distinct on (book_id) book_id, settlement_currency, exchange_rate
  from public.settlements
  where settlement_currency is not null and exchange_rate is not null
) s
where b.id = s.book_id;

alter table public.settlements
  drop column settlement_currency,
  drop column exchange_rate;
