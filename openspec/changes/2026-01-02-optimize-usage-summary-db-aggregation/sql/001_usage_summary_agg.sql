-- Usage summary aggregation RPC (no lag)
-- Change: 2026-01-02-optimize-usage-summary-db-aggregation

create or replace function public.vibescore_usage_summary_agg(
  p_from timestamptz,
  p_to timestamptz,
  p_source text default null,
  p_model text default null
)
returns table (
  source text,
  model text,
  total_tokens bigint,
  input_tokens bigint,
  cached_input_tokens bigint,
  output_tokens bigint,
  reasoning_output_tokens bigint,
  rows_scanned bigint,
  rows_scanned_total bigint
)
language sql
stable
as $$
  select
    source,
    model,
    coalesce(sum(total_tokens), 0)::bigint as total_tokens,
    coalesce(sum(input_tokens), 0)::bigint as input_tokens,
    coalesce(sum(cached_input_tokens), 0)::bigint as cached_input_tokens,
    coalesce(sum(output_tokens), 0)::bigint as output_tokens,
    coalesce(sum(reasoning_output_tokens), 0)::bigint as reasoning_output_tokens,
    count(*)::bigint as rows_scanned,
    sum(count(*)) over ()::bigint as rows_scanned_total
  from public.vibescore_tracker_hourly
  where user_id = auth.uid()
    and hour_start >= p_from
    and hour_start < p_to
    and (p_source is null or source = p_source)
    and (p_model is null or model = p_model)
    and (
      lower(coalesce(p_source, '')) = 'canary'
      or lower(coalesce(p_model, '')) = 'canary'
      or (lower(source) <> 'canary' and lower(model) <> 'canary')
    )
  group by source, model;
$$;

grant execute on function public.vibescore_usage_summary_agg(
  timestamptz,
  timestamptz,
  text,
  text
) to anon, authenticated;
