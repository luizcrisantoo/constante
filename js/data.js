'use strict';
const DIAS_NOME = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DIAS_ABREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
// Onboarding por intenção: o que a pessoa veio buscar → o que o app já deixa pronto.
const INTENCOES = [
  {id:'treino', icone:'💪', nome:'Treinar com constância'},
  {id:'comer',  icone:'🍽️', nome:'Comer melhor'},
  {id:'agua',   icone:'💧', nome:'Beber mais água'},
  {id:'sono',   icone:'😴', nome:'Dormir melhor'},
  {id:'estudo', icone:'📚', nome:'Estudar / organizar o dia'},
  {id:'grana',  icone:'💰', nome:'Controlar a grana'},
  {id:'cabeca', icone:'🧠', nome:'Cuidar da cabeça'},
  {id:'aposta', icone:'🎯', nome:'Reduzir apostas'}
];
// Sugestões — não são receita: a pessoa tira o que não faz sentido antes de começar.
const SUGESTOES_HABITO = {
  treino:[{icone:'🤸',nome:'Alongar 10 min',tipo:'fazer'},{icone:'🚶',nome:'Caminhar 20 min',tipo:'fazer'}],
  comer :[{icone:'🍎',nome:'Comer uma fruta',tipo:'fazer'},{icone:'🥤',nome:'Refrigerante',tipo:'evitar'}],
  agua  :[{icone:'💧',nome:'Garrafa de água por perto',tipo:'fazer'}],
  sono  :[{icone:'🌙',nome:'Dormir antes das 00h',tipo:'fazer'},{icone:'📵',nome:'Celular na cama',tipo:'evitar'}],
  estudo:[{icone:'📚',nome:'Estudar 30 min',tipo:'fazer'},{icone:'📖',nome:'Ler 10 páginas',tipo:'fazer'}],
  grana :[{icone:'🧾',nome:'Anotar os gastos do dia',tipo:'fazer'}],
  cabeca:[{icone:'🧘',nome:'Respirar 3 min',tipo:'fazer'},{icone:'📝',nome:'Escrever como foi o dia',tipo:'fazer'}],
  aposta:[{icone:'🎯',nome:'Apostar',tipo:'evitar'}]
};
const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ---- v51: barra de baixo personalizável ----
// "Hoje" é fixa (é a casa do app). As outras a pessoa escolhe — o que sobrar
// vai pro botão "Mais", então nada fica inalcançável.
const ABAS = [
  {id:'hoje',      icone:'☀️', nome:'Hoje', fixa:true},
  {id:'rotina',    icone:'📅', nome:'Rotina'},
  {id:'dieta',     icone:'🍽️', nome:'Dieta'},
  {id:'grana',     icone:'💰', nome:'Grana'},
  {id:'mente',     icone:'🧠', nome:'Mente'},
  {id:'progresso', icone:'📈', nome:'Progresso'},
  {id:'config',    icone:'⚙️', nome:'Ajustes'}
];
const BARRA_MAX = 5;                 // Hoje + 4 à escolha
const BARRA_PADRAO = ['hoje','rotina','dieta','grana','progresso'];
// Intenção escolhida no primeiro uso → aba que provavelmente importa pra ela.
const BARRA_POR_INTENCAO = {
  treino:'rotina', comer:'dieta', agua:'dieta', sono:'mente',
  estudo:'rotina', grana:'grana', cabeca:'mente', aposta:'mente'
};

// ---- v51: projetos financeiros (gasto por objetivo) ----
// CATEGORIA = com o QUE você gastou · PROJETO = pra QUAL objetivo.
// São dimensões diferentes: o mesmo gasto pode ter as duas.
// ---- v56: de onde vem o dinheiro que entra ----
const FONTES_RECEITA = [
  {id:'salario', icone:'💼', nome:'Salário'},
  {id:'freela',  icone:'💻', nome:'Freela'},
  {id:'venda',   icone:'🏷️', nome:'Venda'},
  {id:'presente',icone:'🎁', nome:'Presente'},
  {id:'extra',   icone:'✨', nome:'Extra'},
  {id:'outros',  icone:'📥', nome:'Outros'}
];

// ---- v57: contas que se repetem todo mês ----
const MODELOS_CONTA = [
  {icone:'🏠', nome:'Aluguel'},   {icone:'💡', nome:'Luz'},
  {icone:'💧', nome:'Água'},      {icone:'📶', nome:'Internet'},
  {icone:'📱', nome:'Celular'},   {icone:'🎬', nome:'Streaming'},
  {icone:'🏋️', nome:'Academia'},  {icone:'📄', nome:''}
];

const MODELOS_PROJETO = [
  {icone:'💍', nome:'Casamento'},
  {icone:'✈️', nome:'Viagem'},
  {icone:'🔨', nome:'Reforma'},
  {icone:'📦', nome:'Mudança'},
  {icone:'🎓', nome:'Faculdade'},
  {icone:'🎉', nome:'Festa'},
  {icone:'🚗', nome:'Carro'},
  {icone:'✨', nome:''}
];
const UNIDADES = {
  min: { nome:'minutos', abrev:'min' },
  vez: { nome:'vezes',   abrev:'x'   },
  brl: { nome:'reais',   abrev:'R$'  }
};

function defaultState(){
  return {
    version: 4,
    criadoEm: hojeISO(),
    profile: {
      nome:'', foto:null, peso:null, altura:null, nascimento:'',
      kcalAlvo:null, protMin:null, aguaAlvoMl:null,
      aguaRecipientes:[],          // vazio = usa o padrão (copo 250 + garrafa 500)
      aguaUnidade:'L',             // como o total aparece: 'L' ou 'ml'
      tmbMedida:null, obsCalorimetria:''
    },
    settings: {
      sono:{ deitar:'23:00', acordar:'07:00', deitarFds:'23:30', acordarFds:'08:00', melatonina:'' },
      syncUrl:'', syncKey:'', syncCode:'', syncAuto:true, ultimaSync:null,
      onboard:{ feito:false, intencoes:[], vitoria:'' },
      barra:null,                                  // null = o app sugere pela intenção
      avisos:{ silencioDe:'22:30', silencioAte:'06:00', antecedencia:0, volta:true },
      revisaoVista:'',                             // semana (segunda ISO) já revisada
      fotoPlanoVisto:false                         // dispensou o convite de fotografar o plano
    },
    pesos: [],
    habits: [],
    routine: [],
    diet: {
      alvo:'',
      aviso:'',
      refeicoes: [],
      hidratacao:'Recomendação comum: cerca de 35 ml de água por kg de peso por dia.',
      constante:[]
    },
    meds: {
      aviso:'Cadastre seus remédios e suplementos, com os horários de tomar.',
      grupos: []
    },
    finance: {
      rendas:[],
      aporteMensal:0,
      metodo:'snowball',
      dividas:[],
      extras:[]
    },
    bets: {
      inicioPlano: hojeISO(),
      alvo: '',
      unidade: 'min',
      limiteSemanaInicial: 0,
      semanasParaZero: 8,
      ativo: false,
      nota:'Redução gradual, sem corte seco: o limite semanal cai a cada semana até a meta.'
    },
    treinos: {
      aviso:'Monte seus treinos e registre as cargas de cada exercício — na próxima vez o app te lembra da última.',
      split:[
        {id:'a', dia:'', nome:'Treino A', foco:'', exercicios:[]},
        {id:'b', dia:'', nome:'Treino B', foco:'', exercicios:[]},
        {id:'c', dia:'', nome:'Treino C', foco:'', exercicios:[]},
        {id:'d', dia:'', nome:'Treino D', foco:'', exercicios:[]}
      ]
    },
    gastos: {
      categorias:[
        {id:'g_alim', nome:'Alimentação', icone:'🍔', cor:'var(--c-refeicao)'},
        {id:'g_transp', nome:'Transporte', icone:'🚗', cor:'var(--c-aula)'},
        {id:'g_lazer', nome:'Lazer', icone:'🎮', cor:'var(--c-sites)'},
        {id:'g_saude', nome:'Saúde', icone:'💊', cor:'var(--c-estagio)'},
        {id:'g_casa', nome:'Casa/contas', icone:'🏠', cor:'var(--c-estudo)'},
        {id:'g_outros', nome:'Outros', icone:'📦', cor:'var(--c-livre)'}
      ],
      lancamentos:[],
      projetos:[],
      receitas:[],             // v56: o que ENTRA. Lista separada de propósito —
                               // gastosDoMes, calendário e projetos só olham lancamentos.
      contas:[],               // v57: contas fixas do mês (aluguel, luz, assinatura)
      cartoes:[]               // v57: cartões de crédito (fechamento e vencimento)

    },
    estudo: {
      cadernos:[]
    },
    progresso: [],
    lembretes: [],
    categorias: [
      {id:'aula', nome:'Aula', cor:'#3987e5'},
      {id:'estagio', nome:'Estágio', cor:'#199e70'},
      {id:'treino', nome:'Treino', cor:'#d95926'},
      {id:'refeicao', nome:'Refeição', cor:'#c98500'},
      {id:'estudo', nome:'Estudo', cor:'#9085e9'},
      {id:'sites', nome:'Sites', cor:'#d55181'},
      {id:'idioma', nome:'Idiomas', cor:'#3987e5'},
      {id:'leitura', nome:'Leitura', cor:'#199e70'},
      {id:'sono', nome:'Sono', cor:'#6d6a8f'},
      {id:'livre', nome:'Livre', cor:'#565550'},
      {id:'pausa', nome:'Pausa', cor:'#565550'},
      {id:'desloc', nome:'Deslocamento', cor:'#45443f'},
      {id:'remedios', nome:'Remédios', cor:'#e66767'},
      {id:'revisao', nome:'Revisão', cor:'#c98500'}
    ],
    days: {},
    gamif: { xpTotal:0, conquistas:[] }
  };
}

const NIVEIS = [
  { xp:0,    nome:'Começo',   icone:'🌱' },
  { xp:300,  nome:'Bronze',   icone:'🥉' },
  { xp:800,  nome:'Prata',    icone:'🥈' },
  { xp:1600, nome:'Ouro',     icone:'🥇' },
  { xp:3000, nome:'Diamante', icone:'💎' },
  { xp:5000, nome:'Constante',icone:'🟣' }
];

const FRASES = [
  'Constância vence intensidade.',
  'Você não precisa de um dia perfeito. Precisa de um dia feito.',
  'Cada passo pequeno é um tijolo da sua liberdade.',
  'Sono é treino, estudo e terapia — tudo ao mesmo tempo.',
  'O você de 2027 agradece o que você fizer hoje.',
  'Menos picos, mais progresso.',
  'Feito é melhor que perfeito.',
  'Sua ofensiva não quebra num dia ruim. Quebra quando você desiste.'
];

// ============================================================
// NOVIDADES — o que mudou a cada atualização grande.
// A entrada mais NOVA fica em primeiro. "v" acompanha a versão do
// service worker (sw.js). Só entra aqui o que o usuário percebe:
// escreve o BENEFÍCIO, em português de gente, sem jargão técnico.
// ============================================================
const NOVIDADES = [
  { v:57, data:'2026-08-19', destaque:true, titulo:'Contas e cartão — a sobra virou verdade', itens:[
    '💳 CARTÃO DE CRÉDITO: cadastre o cartão com o dia que fecha e o dia que vence, e a compra vai pra fatura CERTA em vez de parecer que o dinheiro saiu hoje. Na hora de registrar o gasto aparece "Como pagou": à vista/débito/pix ou o cartão.',
    '🔟 PARCELOU? Escreve em quantas vezes e o app espalha nas faturas dos próximos meses sozinho. Cada parcela aparece com "3/10" do lado.',
    '📄 CONTAS DO MÊS: aluguel, luz, internet, academia — o que vence todo mês. Você cadastra uma vez com o dia do vencimento. Quando pagar, toca em "Paguei" e vira um gasto de verdade (dá pra corrigir o valor, porque luz nunca vem igual).',
    '⚖️ E aí aparece o número que faltava: QUANTO JÁ TEM DONO. Contas a vencer + fatura do mês, somados e separados da sobra. Sobra é o que está na tua mão; comprometido é o que ainda vai sair. Misturar os dois é o que faz app de finança dar número bonito e a conta não fechar.',
    '🙏 Tudo isso veio de dois testers no zap, no mesmo dia — um perguntou de receita, o outro emendou contas, cartão e saldo comprometido. É opcional: quem só anota gasto não vê nada disso até cadastrar a primeira conta ou o primeiro cartão.'
  ]},
  { v:56, data:'2026-08-19', titulo:'A Grana passou a contar o que ENTRA', itens:[
    '📥 Agora dá pra registrar entrada, não só gasto: salário, freela, venda, presente. O botão fica ao lado do "+ Gasto", na aba Grana.',
    '⚖️ Assim que você registra a primeira entrada, o topo da Grana vira o retrato do mês: quanto entrou, quanto saiu e o que sobrou. Quem só quer anotar gasto não vê nada disso mudar — continua igual até registrar a primeira entrada.',
    '🧾 As entradas ficam num extrato próprio, separadas dos gastos, e não entram no calendário nem nos projetos: lá continua sendo só o que sai.',
    '💬 Pedido do tester que perguntou "tu vai colocar receita na parte da grana?". Vai. 😄'
  ]},
  { v:55, data:'2026-08-19', titulo:'Mais legível, e abrindo mais rápido', itens:[
    '👀 Textos secundários (aqueles cinzinhas) e os dias futuros no calendário da Grana estavam claros demais pra quem enxerga menos — reprovavam no padrão de contraste. Foram ajustados sem mudar a cara do app.',
    '🏷️ Todos os campos de Ajustes e do Sono agora têm o rótulo ligado ao campo. Quem usa leitor de tela ouvia só "caixa de edição" e não sabia o que estava preenchendo.',
    '⚡ A primeira abertura do app ficou mais rápida: o arquivo de cores era baixado só DEPOIS do arquivo de estilos, um esperando o outro. Agora vão juntos.'
  ]},
  { v:54, data:'2026-08-19', titulo:'Um convite pra voltar (e nada além disso)', itens:[
    '💜 Se você passar 2 dias sem abrir o app, ele te manda UM convite às 19h. Se passar uma semana, manda outro. Só isso — nunca todo dia, nunca cobrando, nunca dizendo que você falhou. A ideia é lembrar que dá pra recomeçar, não fazer você se sentir mal.',
    '🔕 E dá pra desligar num toque: Ajustes → Avisos que ajudam → "me chamar de volta". Ele também respeita o teu horário de silêncio.',
    '🔒 Pra isso funcionar, o servidor passou a olhar só a hora da tua última sincronização e a tua configuração de avisos — antes ele carregava teu estado inteiro (peso, humor, remédios) a cada minuto sem precisar. Menos dado circulando, mesmo resultado.'
  ]},
  { v:53, data:'2026-08-18', titulo:'Água do teu jeito (e um começo mais fácil)', itens:[
    '💧 A ÁGUA AGORA É SUA: dá pra criar os botões do tamanho que você bebe de verdade — copo de 200, garrafa de 600, garrafinha de 473. Toca no ✎ do card de Água, escolhe um tamanho pronto ou digita o teu, e dá um nome. Cabem 4 botões.',
    '↩︎ E tem um botão de desfazer que tira exatamente o último volume que você somou, em vez do valor fixo de antes.',
    '🔢 Se você pensa em mililitros e não em litros, dá pra trocar como o total aparece. Por dentro o app sempre guardou em ml, então a sua meta e o que já foi registrado continuam iguais.',
    '👋 QUEM ESTÁ CHEGANDO não abre mais o app numa tela vazia: aparecem três sugestões e um toque já cria o hábito e marca o dia. O primeiro dia começa feito, não em branco.'
  ]},
  { v:52, data:'2026-08-18', titulo:'O que já existia, agora aparece', itens:[
    '↩️ REPETIR ONTEM virou cartão de verdade na tela Hoje, e aparece na hora certa: quando o dia ainda está vazio e ontem teve movimento. Antes era um botãozinho no canto do título que ninguém via.',
    '🌙 DIA DIFÍCIL agora é oferecido quando você volta depois de uns dias fora — que é justamente quando ele serve. Marcar o dia como difícil não quebra sua linha, e ninguém precisava descobrir isso sozinho.',
    '📸 FOTOGRAFAR O PLANO deixou de sumir. Enquanto a dieta ou o treino estiverem vazios, o convite fica na tela Hoje: você fotografa a folha do nutri ou a ficha do personal e o app monta. Dá pra dispensar com um toque.',
    '💰 O CAMPO DE VALOR DO GASTO parou de implicar: agora aceita "12,50", "R$ 12,50", "1.500" e "1.500,75" do mesmo jeito. E se ainda assim não der, a mensagem diz o que fazer em vez de só reclamar.',
    '⌨️ No Android, o teclado não cobre mais o botão de salvar dentro das janelas — dava pra digitar o gasto e não conseguir registrar.',
    '⏭ Empurrar o treino pra amanhã agora é um botão, não um link escondido no rodapé.'
  ]},
  { v:51, data:'2026-08-16', destaque:true, titulo:'O sistema ficou calmo — 4 coisas novas', itens:[
    '📱 A BARRA DE BAIXO AGORA É SUA: "Hoje" fica fixo e você escolhe as outras 4 abas. O que sobrar não some — vai pro botão "Mais" (⋯) no canto. Pra mexer: segure o dedo na própria barra por um segundo, ou vá em Ajustes → Barra de baixo. A ordem é a ordem em que você tocar nas abas.',
    '💰 PROJETOS NA GRANA: categoria é COM O QUE você gastou (Materiais); projeto é PRA QUAL objetivo (Reforma do apto). Agora dá pra marcar as duas coisas e ver quanto já saiu por objetivo — viagem, casamento, faculdade, o que for. Tem modelos prontos. É totalmente opcional: quem não criar nenhum projeto não vê campo nenhum a mais na hora de lançar o gasto.',
    '📊 REVISÃO DA SEMANA: no domingo aparece um convite na tela Hoje pra ver o retrato dos seus 7 dias — dias que contaram, hábito por hábito, treinos, sono e gasto da semana. Sem nota, sem ranking, sem cobrança: é retrato, não boletim. Dá pra abrir quando quiser pela aba Progresso.',
    '🔔 AVISOS QUE AJUDAM: em Ajustes agora dá pra criar os lembretes direto da sua rotina, de uma vez — cada bloco vira um aviso no horário certo e só nos dias em que ele existe. Você escolhe se quer ser avisado na hora ou 10/30 minutos antes, e define um horário de silêncio (padrão 22:30 às 06:00) que o app respeita: nada é criado dentro dele.'
  ]},
  { v:50, data:'2026-08-14', titulo:'Layout que não estoura mais a tela', itens:[
    '📱 Corrigido o problema que alguns relataram no Android: ao trocar de aba, a tela saía do lugar e só voltava dando zoom pra fora e pra dentro. A causa era o layout deixando o conteúdo passar da largura da tela — um nome de hábito comprido ou a barra dos dias da Rotina empurravam a página inteira.',
    '✅ Agora nada cria rolagem lateral: texto longo quebra a linha, a barra dos dias rola dentro dela mesma, e as telas foram medidas em 320, 360 e 412 pixels de largura pra garantir.'
  ]},
  { v:49, data:'2026-08-14', destaque:true, titulo:'Agora dá pra fazer junto com alguém', itens:[
    '👥 COMO ADICIONAR ALGUÉM: aba Progresso → Pessoas → "+ Adicionar". O app te dá um código de 8 letras — manda pra pessoa pelo zap (tem botão de enviar). Basta UM de vocês digitar o código do outro; depois disso os dois se veem. Ninguém te encontra por busca nem por e-mail: só entra quem você convidar, e você desfaz quando quiser.',
    '👀 O QUE A PESSOA VÊ: teu nome, teus dias de constância e tua moldura. Hábito, só o que VOCÊ marcar, um por um — e o nome dele aparece, então renomeia antes se for algo pessoal. Hábito de EVITAR (tipo "sem apostas") nunca pode ser compartilhado, nem se você quiser. Peso, dinheiro, humor, remédios, apostas e anotações não saem daqui de jeito nenhum.',
    '🔥 GRUPOS (2 a 8 pessoas): em "Juntos" você cria um grupo, dá um nome e marca quem chamar entre as pessoas que já adicionou — igual grupo de zap. Quem não está na tua lista entra pelo código. Cada pessoa que aceita escolhe qual hábito DELA conta ali: pode ser "Academia" pra você e "Correr" pra outra. Ninguém entra sem aceitar.',
    '🎯 COMO O CONTADOR DO GRUPO FUNCIONA: ele só anda no dia em que o grupo bate a meta — que começa em "todo mundo" e pode ser afrouxada pra "4 de 6" se vocês quiserem. Se um dia passar sem bater, ele recomeça do zero. Você não marca nada de diferente: é só bater o teu hábito na tela Hoje, como sempre.',
    '🧍 IMPORTANTE: esse contador é do grupo. A TUA constância individual não é afetada por nada disso — se o grupo perder o foguinho, a tua linha continua intacta.',
    '🙈 E a aba Grana ganhou um botão de esconder os valores, pra abrir o app no ônibus ou no trampo sem mostrar quanto você tem.'
  ]},
  { v:48, data:'2026-08-14', titulo:'O foguinho em grupo', itens:[
    '🔥 Nova seção Juntos: um grupo de 2 a 8 pessoas com um hábito em comum. Cada um escolhe qual hábito SEU conta ali, e o contador do grupo só anda no dia em que a meta for batida. Se um dia passar sem bater, ele recomeça do zero.',
    '🎯 A meta começa em "todo mundo" — que é o foguinho clássico, de dois. Se o grupo for grande, vocês podem afrouxar pra "4 de 6" e o contador respeita isso.',
    '🧍 Esse contador é do grupo. A tua constância individual não é afetada por nada disso: você bate o teu dia normalmente e ela segue igual.',
    '🔒 Entra quem tem o código do grupo. Cada um sai sozinho quando quiser, e ninguém tira ninguém.'
  ]},
  { v:47, data:'2026-08-14', titulo:'Dá pra puxar alguém junto', itens:[
    '🤝 Agora dá pra adicionar uma pessoa: você manda teu código, ela entra com ele (ou o contrário) e vocês passam a ver a constância um do outro na aba Progresso.',
    '👀 Ela vê teu nome, teus dias de constância e tua moldura. Hábito, só o que VOCÊ marcar pra compartilhar — um por um. Peso, dinheiro, humor, remédios, apostas e anotações nunca saem daqui.',
    '🔒 Ninguém te acha por busca nem por e-mail: só entra quem você convidou, e qualquer um dos dois desfaz quando quiser.'
  ]},
  { v:46, data:'2026-08-14', titulo:'Os cadernos ganharam cérebro', itens:[
    '📓 Nos cadernos de estudo agora tem três botões: RESUMIR as anotações em tópicos, montar um MAPA MENTAL delas, ou te fazer PERGUNTAS pra você testar se aprendeu.',
    '💾 A resposta pode ser salva ali mesmo como uma anotação nova — o resumo fica junto do material, não perdido numa conversa.',
    '🤖 Ele usa só o que você escreveu: não inventa matéria nem completa o que faltou. Se ficou confuso, ele avisa o que faltou em vez de chutar.'
  ]},
  { v:45, data:'2026-08-14', titulo:'Fotografe seu plano', itens:[
    '📸 Novo caminho curto: fotografa o que você já segue — a dieta do nutri, a ficha do personal, o horário da facul, o cronograma de estudos — e o assistente monta tudo aqui dentro. Aparece na tela de boas-vindas e também vazio dentro de cada aba (Dieta, Rotina, Treino).',
    '🤖 Ele continua não inventando dieta nem treino: só transcreve e organiza o que você trouxer, e você revê antes de aplicar.',
    '📤 E dá pra compartilhar um treino: gera um resumo com os exercícios e as últimas cargas pra mandar pro personal, pra um amigo ou pra você mesmo.'
  ]},
  { v:44, data:'2026-08-14', titulo:'Nada se perde (correções importantes)', itens:[
    '🗑️ O que você apaga fica apagado. Tinha um problema sério aqui: gasto, hábito ou renda que você excluía podia VOLTAR sozinho na próxima sincronização. Corrigido — e a exclusão agora vale nos teus dois aparelhos.',
    '📵 Teu dia não some mais. Se você marcou o dia no celular e depois só abriu o app no computador, o dia podia voltar vazio. Agora os dois lados se juntam, marcação por marcação.',
    '☁️ Se a nuvem não responder, o app insiste sozinho até conseguir — e nunca apaga do aparelho o que ainda não subiu, nem quando você sai da conta.',
    '🛟 Ele também guarda cópias de segurança automáticas antes de a nuvem mexer nos teus dados: dá pra restaurar em Ajustes › Backup & dados.',
    '🎯 E a tela Hoje vem na TUA ordem: o que você marcou lá na abertura (treino, comida, água, sono, cabeça) aparece primeiro.'
  ]},
  { v:43, data:'2026-08-14', titulo:'A linha que não quebra', itens:[
    '🌙 Dia difícil, viagem ou doença? Agora dá pra marcar o dia como neutro: ele não conta como falha e a tua constância PAUSA em vez de zerar. (Também não vira vitória — ninguém sobe a linha dizendo que o dia foi ruim.)',
    '📅 Esqueceu de marcar ontem? Na tela Hoje tem um "‹ esqueci de marcar ontem": dá pra voltar até 2 dias e arrumar o registro, do jeito que já dava com os gastos.',
    '🔒 O peso agora entra borrado e só aparece quando você toca no 👁️ — pra quem usa o app com gente por perto.'
  ]},
  { v:42, data:'2026-08-14', titulo:'Calendário na Grana', itens:[
    '📅 A Grana agora tem calendário do mês: cada dia mostra quanto saiu, e tocando num dia você abre ele — vê os gastos daquele dia e lança direto ali. Esqueceu terça? Toca na terça e anota.',
    '💰 O botão de registrar já vem com o dia que você abriu, e depois de salvar o app te mostra o dia onde o gasto caiu.'
  ]},
  { v:41, data:'2026-08-14', titulo:'Começar ficou mais fácil', itens:[
    '👋 Quem entra pela primeira vez tem uma abertura nova: o app pergunta teu nome e o que te trouxe aqui, e já deixa pronto o que importa pra você (sem receita de bolo — dá pra tirar o que não faz sentido na hora).',
    '🎯 E te empurra pra primeira vitória: marcar uma coisa só, hoje. É assim que a linha começa.'
  ]},
  { v:40, data:'2026-08-14', titulo:'Empurrar treino, repetir ontem e meses na Grana', itens:[
    '⏭ Não deu pra treinar hoje? Agora dá pra empurrar a ficha pra amanhã — ela aparece no dia seguinte e você não perde o músculo da semana. Some sozinho depois.',
    '↩️ De manhã, se o dia for igual ao de ontem, o botão “Repetir ontem” marca os mesmos hábitos, refeições e remédios de uma vez (água, sono e humor ficam de fora — esses são de hoje).',
    '📅 Na Grana dá pra navegar pelos meses anteriores: totais, categorias e extrato de julho, junho, o que for.'
  ]},
  { v:39, data:'2026-08-13', titulo:'Gastos de qualquer dia', itens:[
    '💰 Esqueceu de anotar um gasto? Agora o registro tem campo de DIA — dá pra lançar o de ontem, o de sábado, a semana inteira de uma vez.',
    '📅 E a Grana ganhou extrato: a lista mostra os últimos 7 dias e dá pra abrir o mês inteiro, dia a dia, com o total de cada dia — e remover qualquer lançamento.'
  ]},
  { v:38, data:'2026-08-13', titulo:'Moldura de recorde + app mais vivo', itens:[
    '🖼 Tua foto de perfil ganhou MOLDURA de recorde: 🌱 Semente → 🥉 Bronze (7 dias) → 🥈 Prata (30) → 🥇 Ouro (100) → 🟣 Ametista (365). Ela mostra a tua MELHOR sequência de todos os tempos e nunca rebaixa — chegou no ouro, é teu até você se superar. Toca na foto pra ver tua escada.',
    '✨ O app ganhou vida: check com animação e vibração no celular, transição suave entre as abas e aviso quando você bate um novo recorde pessoal.',
    '😴 Sono mais esperto: ajustou o horário de deitar/acordar? As horas dormidas recalculam na hora (e se você digitar as horas na mão, o app respeita e não mexe).'
  ]},
  { v:37, data:'2026-08-13', titulo:'Fichas destravadas + assistente organiza exercícios', itens:[
    '🧩 Conserto importante: fichas de treino antigas (sem identidade interna) voltaram a abrir e editar — o toque nelas funciona de novo.',
    '📋 O assistente agora ORGANIZA os exercícios nas tuas fichas: cola o texto da ficha do teu personal (ou manda foto/PDF) e pede pra organizar nos treinos — ele preenche nome, foco, dia da semana e exercícios (semana A e B). Séries e cargas você registra treinando.'
  ]},
  { v:35, data:'2026-08-13', titulo:'Cargas sem beco sem saída', itens:[
    '🏋️ Tocou em "Cargas ›" num dia sem ficha ligada? Agora o app pergunta qual ficha é o treino daquele dia, liga com um toque e já abre pra anotar.'
  ]},
  { v:34, data:'2026-08-13', titulo:'Caminho das cargas', itens:[
    '🏋️ Os blocos de treino na Rotina ganharam o botão "Cargas ›" — vai direto pra ficha do dia, sem caçar.',
    '🧭 O card Treino do Hoje agora sempre mostra o próximo passo: "montar exercícios" quando a ficha está vazia, "registrar cargas" quando já tem.'
  ]},
  { v:33, data:'2026-08-13', titulo:'Ajustes à mão + treinos A/B', itens:[
    '⚙️ Os Ajustes ganharam aba própria na barra de baixo — chega de caçar a engrenagem no cantinho.',
    '🏋️ Treinos com semana A × semana B: pra quem alterna fichas (padrão × metabólico). Toca no ✎ do treino pra dar nome, foco e dia — e agora dá pra anotar o descanso de cada exercício.',
    '🤖 O assistente oferece botões de resposta rápida nas perguntas simples — menos digitação.',
    '🧹 Visual mais limpo: menos emoji repetido em títulos e listas, e ajustes finos pra iPhone (recortes de tela) e celulares menores.'
  ]},
  { v:32, data:'2026-08-13', titulo:'Check de treino + recomeço leve', itens:[
    '🏋️ Novo check "Treinei hoje" na aba Hoje: um toque e valeu — academia, corrida, futevôlei, vôlei, cardio, qualquer treino. Dá +10 XP de bônus (e descansar não desconta nada).',
    '🏆 Nova conquista "Treinos feitos": cada treino do seu histórico soma.',
    '🌱 Voltou depois de uns dias fora? O app te recebe com um recomeço leve — sem culpa: constância inclui recomeçar.',
    '💜 Linguagem mais nossa: "ofensiva" virou "constância", e o 🔥 zerado virou 🌱 (novo começo).'
  ]},
  { v:31, data:'2026-08-13', titulo:'Polimento geral', itens:[
    '☁️ Agora dá pra VER se teus dados estão na nuvem: a nuvenzinha no topo mostra o estado, avisa se faltar internet e tenta de novo sozinha.',
    '💪 Treino: registrou uma carga errada? Agora dá pra apagar o registro (no Histórico do exercício).',
    '🍽 Refeições: dá pra remover uma refeição do plano (toca no ✎ dela → Remover).',
    '😴 O sono confirma que salvou — e as horas dormidas aparecem na hora.',
    '📝 Textos, botões e alinhamentos padronizados no app inteiro — e excluir algo agora pede confirmação (chega de sustos).'
  ]},
  { v:30, data:'2026-08-13', titulo:'Central de novidades', itens:[
    '✨ O app agora te conta o que mudou: toda atualização importante aparece aqui no Hoje, e o histórico completo fica em ⚙️ Config → Novidades.'
  ]},
  { v:29, data:'2026-08-12', titulo:'Últimas melhorias', itens:[
    '📄 O assistente aceita PDF: manda a dieta do nutri ou a ficha de treino que ele organiza pra você.',
    '🖼 Foto de perfil: adiciona a sua em ⚙️ Config → Perfil & metas.',
    '📈 Nova aba Progresso: fotos, peso e conquistas num lugar só.',
    '🎨 Categorias da rotina do teu jeito: renomeia, troca as cores e cria novas em ⚙️ Config.',
    '👁 Campos de senha ganharam o "olhinho" — toca nele pra conferir o que digitou.',
    '🔑 Senha mais simples: não precisa mais de símbolo — mín. 8 caracteres, com maiúscula, minúscula e número.',
    '🚪 Criou a conta? Já entra direto, sem esperar e-mail de confirmação.'
  ]}
];
