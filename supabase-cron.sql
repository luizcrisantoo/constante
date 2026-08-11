-- ============================================================
-- CONSTANTE — Agendador dos lembretes (pg_cron)
-- Rode UMA VEZ no SQL Editor, DEPOIS de:
--   1) ter feito o deploy da função "enviar-lembretes"
--   2) ter criado os secrets VAPID_PRIVATE_KEY e CRON_SECRET
--   3) ter deixado "Verify JWT" DESLIGADO nessa função
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- remove o agendamento anterior, se já existir (pra poder rodar de novo)
select cron.unschedule('constante-lembretes')
where exists (select 1 from cron.job where jobname = 'constante-lembretes');

-- chama a função de minuto em minuto
select cron.schedule('constante-lembretes', '* * * * *', $$
  select net.http_post(
    url     := 'https://piiigvazptshbdfgdngw.supabase.co/functions/v1/enviar-lembretes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'TRe1khQbsh2r_7Z0go7xs6q_itk1Ze3h'
    ),
    body    := '{}'::jsonb
  );
$$);

-- Pra conferir depois que agendou:
--   select jobname, schedule, active from cron.job;
-- Pra ver as últimas execuções:
--   select * from cron.job_run_details order by start_time desc limit 10;
