-- profiles 的 RLS 原本只開放本人 select 自己那列，導致其他成員的 LINE 頭像/名字
-- 永遠查不到（member.profile 恆為 null）。比照 20260713150000 guest_read_access 已經
-- 對 books/members/expenses/settlements 採用的門檻（登入即可讀），這裡跟著一致，
-- 不額外做 co-member 限制；line_user_id 則透過下面的 view 限制欄位，不外流。
drop policy "profiles: select own row" on public.profiles;

create policy "profiles: select for authenticated users"
  on public.profiles for select
  using (auth.uid() is not null);

-- security_invoker：查詢者的 RLS（含上面新增的 policy）套用在這個 view 上，
-- 而不是 view 建立者的權限，避免變成越權管道。
create view public.member_profiles
with (security_invoker = true) as
select id, display_name, avatar_url
from public.profiles;

create or replace function public.get_book_bundle(p_book_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'book', (
      select to_jsonb(b) || jsonb_build_object(
        'members', coalesce((
          select jsonb_agg(
            to_jsonb(m) || jsonb_build_object('profile', to_jsonb(pr))
            order by m.created_at asc
          )
          from public.members m
          left join public.member_profiles pr on pr.id = m.profile_id
          where m.book_id = b.id
        ), '[]'::jsonb)
      )
      from public.books b
      where b.id = p_book_id
    ),
    'members', coalesce((
      select jsonb_agg(
        to_jsonb(m) || jsonb_build_object('profile', to_jsonb(pr))
        order by m.created_at asc
      )
      from public.members m
      left join public.member_profiles pr on pr.id = m.profile_id
      where m.book_id = p_book_id
    ), '[]'::jsonb),
    'expenses', coalesce((
      select jsonb_agg(
        to_jsonb(e) || jsonb_build_object(
          'payer', to_jsonb(payer_m) || jsonb_build_object('profile', to_jsonb(payer_pr)),
          'expense_splits', coalesce((
            select jsonb_agg(to_jsonb(es) || jsonb_build_object('member', to_jsonb(sm)))
            from public.expense_splits es
            join public.members sm on sm.id = es.member_id
            where es.expense_id = e.id
          ), '[]'::jsonb)
        )
        order by e.date desc, e.created_at desc
      )
      from public.expenses e
      join public.members payer_m on payer_m.id = e.payer_member_id
      left join public.member_profiles payer_pr on payer_pr.id = payer_m.profile_id
      where e.book_id = p_book_id
    ), '[]'::jsonb),
    'settlements', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at asc)
      from public.settlements s
      where s.book_id = p_book_id
    ), '[]'::jsonb)
  )
  where exists (select 1 from public.books b2 where b2.id = p_book_id);
$$;
