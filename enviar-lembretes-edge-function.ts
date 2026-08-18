// ============================================================
// CONSTANTE — Edge Function "enviar-lembretes"  (v2 — com o convite de volta)
// Chamada pelo pg_cron de minuto em minuto.
//
// O que ela faz agora:
//   1) LEMBRETES — dispara o que a pessoa criou, no minuto certo (Brasília).
//   2) CONVITE DE VOLTA — quem sumiu há 2 ou 7 dias recebe UM convite, sem culpa.
//
// IMPORTANTE: nesta função, deixe "Verify JWT" DESLIGADO
// (ela é chamada pelo cron, não por usuário) — a proteção é o
// header x-cron-secret, conferido contra o secret CRON_SECRET.
//
// Secrets usados: CRON_SECRET, VAPID_PRIVATE_KEY (e opcional VAPID_SUBJECT).
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente.
// ============================================================

import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC = 'BBCkuS8n0jmdTx-AJu-Czc6hxRqWy-L2pzhz9ny_Gd4B6-kd8qM9xYLJi7lGXCokbWAMZu9Kr1fs2tCPtjekN6s'

// ---- Convite de volta ----------------------------------------------------
// Sai UMA vez por dia, só nesse minuto. Como só dispara quando a ausência é de
// EXATAMENTE 2 ou 7 dias, ninguém recebe dois dias seguidos — e não precisa de
// tabela nenhuma pra lembrar o que já foi enviado.
const HORA_VOLTA = '19:00'
const DIAS_VOLTA: Record<number, string> = {
  2: 'Tá aí? Recomeçar também é constância — uma água já conta como dia começado 💧',
  7: 'Uma semana fora não apaga nada do que você construiu. Tá tudo aqui quando você quiser 💜'
}

function json(o: unknown, s = 200): Response {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } })
}
function h(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
}

// Data no fuso de Brasília (UTC-3, sem horário de verão), formato AAAA-MM-DD
function diaBR(ms: number): string {
  return new Date(ms - 3 * 3600 * 1000).toISOString().slice(0, 10)
}
// Diferença em dias INTEIROS entre duas datas de Brasília — não em horas corridas,
// senão "ontem às 23h" viraria 0 dia e "ontem às 1h" viraria 1.
function diasDesde(isoUtc: string, agoraMs: number): number {
  const t = Date.parse(isoUtc)
  if (!isFinite(t)) return -1
  const a = Date.parse(diaBR(t) + 'T00:00:00Z')
  const b = Date.parse(diaBR(agoraMs) + 'T00:00:00Z')
  return Math.round((b - a) / 86400000)
}
function hmMin(hm: unknown): number {
  const [hh, mm] = String(hm || '').split(':').map(Number)
  return (isFinite(hh) ? hh : 0) * 60 + (isFinite(mm) ? mm : 0)
}
// O silêncio pode atravessar a meia-noite (22:30 → 06:00)
function noSilencio(hm: string, de: unknown, ate: unknown): boolean {
  const m = hmMin(hm), d = hmMin(de || '22:30'), a = hmMin(ate || '06:00')
  return d <= a ? (m >= d && m < a) : (m >= d || m < a)
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return json({ erro: 'não autorizado' }, 401)
  }
  const priv = Deno.env.get('VAPID_PRIVATE_KEY')
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!priv || !url || !key) return json({ erro: 'configuração incompleta' }, 500)

  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') || 'mailto:luiz.crisanto@gmail.com', VAPID_PUBLIC, priv)

  const agora = Date.now()
  const br = new Date(agora - 3 * 3600 * 1000)
  const horaAtual = `${String(br.getUTCHours()).padStart(2, '0')}:${String(br.getUTCMinutes()).padStart(2, '0')}`
  const dia = br.getUTCDay()

  const subsResp = await fetch(`${url}/rest/v1/push_subs?select=user_id,endpoint,inscricao`, { headers: h(key) })
  const subs = await subsResp.json()
  if (!Array.isArray(subs) || subs.length === 0) return json({ enviados: 0, volta: 0, horaAtual })

  const ids = [...new Set(subs.map((s: any) => s.user_id))]

  // Lê só os PEDAÇOS do estado que esta função precisa (lembretes, config de avisos
  // e a hora da última sincronização). Antes ela baixava o estado inteiro de todo
  // mundo a cada minuto — peso, humor, remédios, tudo. Nada disso é da conta dela.
  const campos = 'user_id,updated_at,lembretes:payload->lembretes,avisos:payload->settings->avisos'
  let accs: any[] = []
  const accResp = await fetch(`${url}/rest/v1/constante_accounts?select=${encodeURIComponent(campos)}&user_id=in.(${ids.join(',')})`, { headers: h(key) })
  if (accResp.ok) accs = await accResp.json()
  // Rede de segurança: se a leitura estreita não vier como esperado (versão diferente
  // do PostgREST, por exemplo), volta pro jeito antigo em vez de parar de avisar todo mundo.
  const estreitaFalhou = !Array.isArray(accs) || (accs.length > 0 && accs.every((a: any) => a && a.lembretes === undefined))
  if (estreitaFalhou) {
    const r2 = await fetch(`${url}/rest/v1/constante_accounts?select=user_id,payload,updated_at&user_id=in.(${ids.join(',')})`, { headers: h(key) })
    const brutos = await r2.json()
    accs = (Array.isArray(brutos) ? brutos : []).map((a: any) => ({
      user_id: a.user_id,
      updated_at: a.updated_at,
      lembretes: a?.payload?.lembretes,
      avisos: a?.payload?.settings?.avisos
    }))
  }

  const porUser: Record<string, any> = {}
  for (const a of accs) {
    if (a && a.user_id) porUser[a.user_id] = a
  }

  let enviados = 0
  let volta = 0
  const horaDeChamar = (horaAtual === HORA_VOLTA)

  for (const s of subs) {
    const conta = porUser[s.user_id]
    const lembretes = Array.isArray(conta?.lembretes) ? conta.lembretes : []
    const avisos = (conta?.avisos && typeof conta.avisos === 'object') ? conta.avisos : {}

    // ---- 1) lembretes do minuto ----
    const devidos = lembretes.filter((l: any) =>
      l && l.ativo !== false && l.hora === horaAtual &&
      (!Array.isArray(l.dias) || l.dias.length === 0 || l.dias.includes(dia))
    )
    for (const l of devidos) {
      if (await enviar(s, {
        titulo: 'Constante',
        body: String(l.texto || 'Lembrete').slice(0, 140),
        tag: 'lembrete-' + (l.id || ''),
        url: './'
      })) enviados++
    }

    // ---- 2) convite de volta ----
    // Regras, nessa ordem: é a hora combinada · a pessoa não desligou · não está
    // dentro do silêncio dela · e a ausência é de exatamente 2 ou 7 dias.
    if (!horaDeChamar) continue
    if (avisos.volta === false) continue
    if (noSilencio(horaAtual, avisos.silencioDe, avisos.silencioAte)) continue
    if (!conta?.updated_at) continue
    const d = diasDesde(conta.updated_at, agora)
    const texto = DIAS_VOLTA[d]
    if (!texto) continue
    if (await enviar(s, { titulo: 'Constante', body: texto, tag: 'volta', url: './' })) volta++
  }

  return json({ enviados, volta, horaAtual, dia })

  // Envia e limpa inscrição morta. Devolve true se foi.
  async function enviar(s: any, corpo: Record<string, unknown>): Promise<boolean> {
    try {
      await webpush.sendNotification(s.inscricao, JSON.stringify(corpo))
      return true
    } catch (e: any) {
      const code = e?.statusCode
      if (code === 404 || code === 410) {
        await fetch(`${url}/rest/v1/push_subs?user_id=eq.${s.user_id}&endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE', headers: h(key!) })
      }
      return false
    }
  }
})
