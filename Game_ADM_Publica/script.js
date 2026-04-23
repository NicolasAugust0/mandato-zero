/* ============================================
   MANDATO ZERO: CRISE TOTAL
   Game Logic — script.js
   ============================================ */

'use strict';

const Game = (() => {

  // ── Estado global do jogo ──────────────────
  let state = {};

  // ── Mensagens do ticker de notícias ────────
  const tickerMessages = [
    "Governo enfrenta pressão por reformas...",
    "Câmara debate projeto de austeridade fiscal...",
    "Manifestantes pedem mais investimento em saúde...",
    "Banco Central mantém taxa de juros elevada...",
    "Oposição critica gastos do governo...",
    "Pesquisa mostra queda na confiança nas instituições...",
    "Prefeitos cobram repasse de verbas federais...",
    "Tensão internacional afeta mercados...",
    "ONGs denunciam corte em programas sociais...",
    "Congresso aprova adiamento de votação crucial...",
    "Especialistas alertam para risco de recessão...",
    "Índice de emprego cai pelo terceiro mês consecutivo...",
  ];

  // ── Banco de eventos aleatórios ─────────────
  const EVENTS = [
    {
      id: 'enchentes',
      icon: '🌊',
      title: 'Enchentes no Sul',
      desc: 'Chuvas intensas atingiram cidades do Sul do país. A população exige ajuda emergencial.',
      severity: 'DESASTRE',
      options: [
        {
          label: '🚨 Decretar emergência e liberar verba',
          cost: 'Caixa -15% | Popularidade +8 | Estabilidade -5',
          apply: (s) => { s.caixa *= 0.85; s.popularidade += 8; s.estabilidade_social -= 5; }
        },
        {
          label: '📋 Resposta burocrática (esperar)',
          cost: 'Popularidade -12 | Estabilidade -10',
          apply: (s) => { s.popularidade -= 12; s.estabilidade_social -= 10; }
        }
      ]
    },
    {
      id: 'seca',
      icon: '☀️',
      title: 'Seca Severa no Nordeste',
      desc: 'A estiagem prolongada afeta lavouras e abastecimento de água em diversas cidades.',
      severity: 'CRISE',
      options: [
        {
          label: '💧 Programa emergencial de cisternas',
          cost: 'Caixa -10% | Popularidade +5 | Estabilidade +3',
          apply: (s) => { s.caixa *= 0.90; s.popularidade += 5; s.estabilidade_social += 3; }
        },
        {
          label: '🔇 Minimizar na mídia',
          cost: 'Popularidade -8 | Estabilidade -8',
          apply: (s) => { s.popularidade -= 8; s.estabilidade_social -= 8; }
        }
      ]
    },
    {
      id: 'ataque',
      icon: '🔫',
      title: 'Ataques Armados na Capital',
      desc: 'Grupos criminosos iniciaram confrontos violentos na região metropolitana. Há vítimas.',
      severity: 'URGENTE',
      options: [
        {
          label: '👮 Operação policial imediata',
          cost: 'Caixa -8% | Popularidade -3 | Estabilidade +10',
          apply: (s) => {
            s.caixa *= 0.92;
            s.popularidade -= (s.prioridades.includes('seguranca') ? 0 : 3);
            s.estabilidade_social += (s.prioridades.includes('seguranca') ? 15 : 10);
          }
        },
        {
          label: '🕊️ Negociar e mediar conflito',
          cost: 'Popularidade -10 | Estabilidade -5',
          apply: (s) => { s.popularidade -= 10; s.estabilidade_social -= 5; }
        }
      ]
    },
    {
      id: 'greve',
      icon: '✊',
      title: 'Greve de Servidores',
      desc: 'Servidores públicos paralisam atividades exigindo reajuste salarial. Serviços essenciais afetados.',
      severity: 'ATENÇÃO',
      options: [
        {
          label: '💼 Negociar reajuste parcial',
          cost: 'Caixa -6% | Apoio Legislativo +5 | Popularidade +4',
          apply: (s) => { s.caixa *= 0.94; s.apoio_legislativo += 5; s.popularidade += 4; }
        },
        {
          label: '🚫 Manter posição, não ceder',
          cost: 'Popularidade -8 | Estabilidade -6 | Apoio Legislativo -5',
          apply: (s) => { s.popularidade -= 8; s.estabilidade_social -= 6; s.apoio_legislativo -= 5; }
        }
      ]
    },
    {
      id: 'escandalo',
      icon: '📰',
      title: 'Denúncia de Corrupção',
      desc: 'A imprensa revelou desvio de verbas em contrato público. A oposição pede CPI.',
      severity: 'CRISE',
      options: [
        {
          label: '🔍 Abrir investigação interna',
          cost: 'Popularidade +5 | Apoio Legislativo -8',
          apply: (s) => { s.popularidade += 5; s.apoio_legislativo -= 8; }
        },
        {
          label: '🛡️ Defender assessores envolvidos',
          cost: 'Popularidade -15 | Apoio Legislativo +5',
          apply: (s) => { s.popularidade -= 15; s.apoio_legislativo += 5; }
        }
      ]
    },
    {
      id: 'manifestacao',
      icon: '📢',
      title: 'Grande Manifestação Popular',
      desc: 'Milhares nas ruas exigindo melhores serviços públicos e fim da corrupção.',
      severity: 'ATENÇÃO',
      options: [
        {
          label: '🤝 Receber representantes',
          cost: 'Popularidade +6 | Estabilidade +5',
          apply: (s) => { s.popularidade += 6; s.estabilidade_social += 5; }
        },
        {
          label: '📺 Ignorar e usar mídia oficial',
          cost: 'Popularidade -10 | Tensão Global +8',
          apply: (s) => { s.popularidade -= 10; s.tensao_global += 8; }
        }
      ]
    },
    {
      id: 'pandemia',
      icon: '🦠',
      title: 'Surto de Doença Infecciosa',
      desc: 'Um surto viral começa a se espalhar nas capitais. Hospitais estão sobrecarregados.',
      severity: 'URGENTE',
      options: [
        {
          label: '🏥 Reforçar o sistema de saúde',
          cost: 'Caixa -12% | Popularidade +10 | Estabilidade +5',
          apply: (s) => {
            s.caixa *= (s.prioridades.includes('saude') ? 0.92 : 0.88);
            s.popularidade += (s.prioridades.includes('saude') ? 15 : 10);
            s.estabilidade_social += 5;
          }
        },
        {
          label: '🙈 Subestimar a crise',
          cost: 'Popularidade -15 | Estabilidade -12',
          apply: (s) => { s.popularidade -= 15; s.estabilidade_social -= 12; }
        }
      ]
    },
    {
      id: 'crise_energia',
      icon: '⚡',
      title: 'Crise Energética',
      desc: 'Reservatórios em nível crítico ameaçam o fornecimento de energia elétrica.',
      severity: 'CRISE',
      options: [
        {
          label: '🔋 Importar energia emergencialmente',
          cost: 'Caixa -10% | Estabilidade +8',
          apply: (s) => { s.caixa *= 0.90; s.estabilidade_social += 8; }
        },
        {
          label: '📉 Racionamento para a população',
          cost: 'Popularidade -12 | Estabilidade -8',
          apply: (s) => { s.popularidade -= 12; s.estabilidade_social -= 8; }
        }
      ]
    }
  ];

  // ── Eventos de tensão global ─────────────────
  const GLOBAL_EVENTS = [
    {
      icon: '🌐',
      title: 'Crise Internacional',
      desc: 'Uma crise diplomática internacional afeta os mercados e a confiança dos investidores no país.',
      severity: 'CRISE GLOBAL',
      options: [
        {
          label: '🤝 Aderir à coalizão internacional',
          cost: 'Caixa -8% | Tensão Global -10 | Apoio Legislativo +5',
          apply: (s) => { s.caixa *= 0.92; s.tensao_global -= 10; s.apoio_legislativo += 5; }
        },
        {
          label: '🚪 Isolamento estratégico',
          cost: 'Tensão Global +5 | Popularidade -5',
          apply: (s) => { s.tensao_global += 5; s.popularidade -= 5; }
        }
      ]
    },
    {
      icon: '☢️',
      title: 'Ameaça Nuclear Iminente',
      desc: 'Tensões entre potências nucleares escalam. O país precisa se posicionar diplomaticamente com urgência.',
      severity: '⚠ ALERTA MÁXIMO',
      options: [
        {
          label: '🛡️ Investir em defesa e diplomacia',
          cost: 'Caixa -18% | Tensão Global -25 | Popularidade +5',
          apply: (s) => { s.caixa *= 0.82; s.tensao_global -= 25; s.popularidade += 5; }
        },
        {
          label: '🔇 Ignorar e esperar',
          cost: 'Tensão Global +20 | Popularidade -15 | Estabilidade -10',
          apply: (s) => { s.tensao_global += 20; s.popularidade -= 15; s.estabilidade_social -= 10; }
        }
      ]
    }
  ];

  // ── Opções de Orçamento Participativo ────────
  const BUDGET_OPTIONS_POOL = [
    {
      title: '🏥 Hospital Regional',
      desc: 'Construção de um novo hospital em área carente',
      cost: 'Caixa -12% | Popularidade +12 | Estabilidade +8',
      apply: (s) => { s.caixa *= 0.88; s.popularidade += 12; s.estabilidade_social += 8; }
    },
    {
      title: '📚 Creches Públicas',
      desc: 'Ampliar vagas em creches municipais',
      cost: 'Caixa -8% | Popularidade +10',
      apply: (s) => { s.caixa *= 0.92; s.popularidade += 10; }
    },
    {
      title: '🚌 Transporte Gratuito',
      desc: 'Passe livre para trabalhadores de baixa renda',
      cost: 'Caixa -10% | Popularidade +14 | Apoio Legislativo +8',
      apply: (s) => { s.caixa *= 0.90; s.popularidade += 14; s.apoio_legislativo += 8; }
    },
    {
      title: '💡 Energia Solar em Favelas',
      desc: 'Programa de eletrificação sustentável',
      cost: 'Caixa -9% | Popularidade +8 | Estabilidade +6',
      apply: (s) => { s.caixa *= 0.91; s.popularidade += 8; s.estabilidade_social += 6; }
    },
    {
      title: '🌳 Parques Urbanos',
      desc: 'Revitalização de áreas verdes nas cidades',
      cost: 'Caixa -6% | Popularidade +6 | Estabilidade +10',
      apply: (s) => { s.caixa *= 0.94; s.popularidade += 6; s.estabilidade_social += 10; }
    },
    {
      title: '🎓 Bolsas Universitárias',
      desc: 'Programa de bolsas para jovens de baixa renda',
      cost: 'Caixa -7% | Popularidade +9 | Apoio Legislativo +5',
      apply: (s) => { s.caixa *= 0.93; s.popularidade += 9; s.apoio_legislativo += 5; }
    }
  ];

  // ── Veredictos finais ─────────────────────────
  const VERDICTS = {
    excelente: [
      "Seu governo ficará marcado na história como um dos mais bem administrados. A população vai às ruas para celebrar! Seu nome é cotado para futuras eleições nacionais.",
      "Gestão exemplar: equilibrou as contas e conquistou a confiança popular. Analistas políticos citam seu mandato como modelo de boas práticas."
    ],
    bom: [
      "Um governo sólido, com avanços reais e alguns tropeços. A população reconhece o esforço, mas sabe que há muito ainda a fazer.",
      "Governou com responsabilidade. Não foi perfeito, mas entregou resultados concretos. A história o lembrará como um gestor competente."
    ],
    regular: [
      "Mandato marcado por crises mal gerenciadas e oportunidades perdidas. A população está cansada, mas o governo sobreviveu. Por pouco.",
      "Muitas promessas, resultados medianos. A aprovação despencou e o caixa ficou no limite. Um mandato para ser esquecido — mas não repetido."
    ],
    fracasso: [
      "Seu governo entrará para os livros como um dos piores da história recente. Protestos nas ruas, investigações abertas e um rombo no caixa difícil de ignorar.",
      "A gestão caótica deixou marcas profundas: serviços públicos degradados, contas no vermelho e uma população que perdeu a fé nas instituições."
    ]
  };

  // ─────────────────────────────────────────────
  //  Inicialização do Estado
  // ─────────────────────────────────────────────
  function initState(prioridades) {
    state = {
      turno: 1,
      prioridades: prioridades,
      popularidade: 60,
      caixa: -10000000,  // déficit inicial
      apoio_legislativo: 50,
      estabilidade_social: 70,
      tensao_global: 10,
      actionTaken: false,
    };

    // Bônus por prioridade
    if (prioridades.includes('saude'))         state.popularidade += 10;
    if (prioridades.includes('educacao'))       state.estabilidade_social += 8;
    if (prioridades.includes('seguranca'))      {} // bônus passivo em eventos
    if (prioridades.includes('infraestrutura')) {} // bônus passivo no caixa
    if (prioridades.includes('economia')) {
      state.caixa = -8000000;
      state.apoio_legislativo += 8;
    }

    clampState();
  }

  function clampState() {
    state.popularidade       = clamp(state.popularidade, 0, 100);
    state.apoio_legislativo  = clamp(state.apoio_legislativo, 0, 100);
    state.estabilidade_social = clamp(state.estabilidade_social, 0, 100);
    state.tensao_global      = clamp(state.tensao_global, 0, 100);
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // ─────────────────────────────────────────────
  //  Navegação entre Telas
  // ─────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function goToSetup() {
    showScreen('screen-setup');
  }

  // ─────────────────────────────────────────────
  //  Setup — Seleção de Prioridades
  // ─────────────────────────────────────────────
  const selectedPriorities = [];

  function togglePriority(el) {
    const p = el.dataset.priority;
    const idx = selectedPriorities.indexOf(p);

    if (idx === -1) {
      if (selectedPriorities.length >= 3) {
        showToast('Máximo 3 prioridades!', 'warning');
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
        return;
      }
      selectedPriorities.push(p);
      el.classList.add('selected');
    } else {
      selectedPriorities.splice(idx, 1);
      el.classList.remove('selected');
    }

    const count = selectedPriorities.length;
    document.getElementById('selected-count').textContent = `${count} / 3 selecionadas`;
    document.getElementById('btn-start-game').disabled = count !== 3;
  }

  function startGame() {
    if (selectedPriorities.length !== 3) return;
    initState([...selectedPriorities]);
    showScreen('screen-game');
    renderGame();
    startTickerLoop();
  }

  // ─────────────────────────────────────────────
  //  Renderização do Dashboard
  // ─────────────────────────────────────────────
  function renderGame() {
    // Indicadores
    setIndicator('pop',  state.popularidade);
    setIndicator('leg',  state.apoio_legislativo);
    setIndicator('stab', state.estabilidade_social);
    setIndicator('tens', state.tensao_global);

    // Tensão mini
    document.getElementById('tension-mini').style.width = state.tensao_global + '%';

    // Caixa
    const caixaEl = document.getElementById('caixa-display');
    caixaEl.textContent = formatMoney(state.caixa);
    caixaEl.classList.toggle('negative', state.caixa < 0);

    // Ano e trimestre
    const year = Math.ceil(state.turno / 4);
    document.getElementById('mandate-year').textContent = `ANO ${year}`;
    document.getElementById('turn-display').textContent = state.turno;

    // Prioridades ativas
    const chipsCont = document.getElementById('active-priorities');
    chipsCont.innerHTML = state.prioridades.map(p =>
      `<span class="priority-chip">${priorityLabel(p)}</span>`
    ).join('');

    // Botão avançar
    document.getElementById('btn-advance').disabled = false;
  }

  function setIndicator(key, value) {
    const v = Math.round(clamp(value, 0, 100));
    document.getElementById(`val-${key}`).textContent = v;
    document.getElementById(`bar-${key}`).style.width = v + '%';
  }

  function formatMoney(v) {
    const abs = Math.abs(v);
    let str;
    if (abs >= 1e9) str = 'R$ ' + (abs / 1e9).toFixed(1) + 'B';
    else if (abs >= 1e6) str = 'R$ ' + (abs / 1e6).toFixed(1) + 'M';
    else str = 'R$ ' + Math.round(abs).toLocaleString('pt-BR');
    return v < 0 ? '-' + str : str;
  }

  function priorityLabel(p) {
    const map = { saude:'🏥 Saúde', educacao:'📚 Educação', seguranca:'🛡️ Segurança', infraestrutura:'🏗️ Infraestrutura', economia:'💰 Economia' };
    return map[p] || p;
  }

  // ─────────────────────────────────────────────
  //  Ticker de Notícias
  // ─────────────────────────────────────────────
  let tickerTimer = null;
  function startTickerLoop() {
    updateTicker();
    tickerTimer = setInterval(updateTicker, 6000);
  }
  function updateTicker() {
    const el = document.getElementById('ticker-text');
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = tickerMessages[Math.floor(Math.random() * tickerMessages.length)];
      el.style.transition = 'opacity 0.5s';
      el.style.opacity = '1';
    }, 300);
  }

  // ─────────────────────────────────────────────
  //  Sistema de Decisões
  // ─────────────────────────────────────────────
  function makeDecision(tipo) {
    if (state.actionTaken) {
      showToast('Já tomou uma decisão este trimestre!', 'warning');
      return;
    }

    switch (tipo) {
      case 'cortar':
        executarDecisao(() => {
          state.caixa += 3000000;
          state.popularidade -= 8;
          state.estabilidade_social -= 4;
          if (state.prioridades.includes('economia')) state.caixa += 500000;
        }, 'Gastos cortados. Caixa melhorou, mas povo não gostou.', 'warning');
        break;

      case 'imposto':
        if (state.apoio_legislativo < 50) {
          mostrarBloqueioLegislativo();
          return;
        }
        executarDecisao(() => {
          state.caixa += 5000000;
          state.popularidade -= 12;
          state.apoio_legislativo -= 6;
          state.estabilidade_social -= 3;
        }, 'Impostos aumentados. Caixa cheio, oposição furiosa.', 'warning');
        break;

      case 'investir':
        executarDecisao(() => {
          const custo = state.prioridades.includes('saude') ? 0.88 : 0.85;
          state.caixa *= custo;
          state.caixa -= 2000000;
          state.popularidade += 10;
          state.estabilidade_social += 8;
          if (state.prioridades.includes('educacao')) state.estabilidade_social += 3;
        }, 'Investimento realizado! Popularidade em alta.', 'positive');
        break;

      case 'emprestimo':
        executarDecisao(() => {
          state.caixa += 12000000;
          state.apoio_legislativo -= 10;
          state.tensao_global += 5;
          // Dívida: penalidade futura simulada
          state.caixa -= 2000000; // juros imediatos
        }, 'Empréstimo tomado. Caixa aliviado, mas a dívida pesa.', 'warning');
        break;
    }
  }

  function executarDecisao(fn, msg, tipo) {
    fn(state);
    clampState();
    state.actionTaken = true;
    renderGame();
    showToast(msg, tipo);
  }

  // ─────────────────────────────────────────────
  //  Bloqueio Legislativo
  // ─────────────────────────────────────────────
  function mostrarBloqueioLegislativo() {
    document.getElementById('blocked-leg-val').textContent = Math.round(state.apoio_legislativo);
    document.getElementById('modal-blocked').style.display = 'flex';
  }

  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  // ─────────────────────────────────────────────
  //  Avanço de Turno
  // ─────────────────────────────────────────────
  function nextTurn() {
    // Efeitos passivos por turno
    applyPassiveEffects();
    clampState();
    renderGame();

    // Verificar condição de game over antecipado
    if (state.popularidade <= 0) {
      setTimeout(() => endGame('impeached'), 800);
      return;
    }

    // Verificar tensão global crítica (> 80)
    if (state.tensao_global > 80) {
      const globalEvt = GLOBAL_EVENTS[Math.floor(Math.random() * GLOBAL_EVENTS.length)];
      showEventModal(globalEvt, () => afterEvent());
      return;
    }

    // Evento a cada turno (~60% de chance)
    if (Math.random() < 0.6) {
      const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      showEventModal(evt, () => afterEvent());
    } else {
      afterEvent();
    }
  }

  function afterEvent() {
    // Orçamento participativo a cada 4 turnos
    if (state.turno % 4 === 0 && state.turno < 16) {
      setTimeout(() => showBudgetModal(), 400);
      return;
    }
    advanceTurn();
  }

  function advanceTurn() {
    state.turno++;
    state.actionTaken = false;
    clampState();

    if (state.turno > 16) {
      endGame('normal');
      return;
    }

    renderGame();
    showToast(`Trimestre ${state.turno} iniciado`, 'neutral');
  }

  // ─────────────────────────────────────────────
  //  Efeitos Passivos por Turno
  // ─────────────────────────────────────────────
  function applyPassiveEffects() {
    // Tensão global sobe automaticamente
    state.tensao_global += 4 + Math.random() * 3;

    // Caixa: pequena variação baseada em economia
    const baseRecovery = state.prioridades.includes('infraestrutura') ? 1200000 : 800000;
    state.caixa += baseRecovery - (Math.random() * 600000);

    // Popularidade decai levemente com o tempo
    state.popularidade -= 1.5 + Math.random() * 1;

    // Estabilidade decai com tensão alta
    if (state.tensao_global > 60) state.estabilidade_social -= 3;

    // Apoio legislativo oscila
    state.apoio_legislativo += (Math.random() - 0.5) * 4;
  }

  // ─────────────────────────────────────────────
  //  Modal de Evento
  // ─────────────────────────────────────────────
  function showEventModal(evt, callback) {
    document.getElementById('event-severity-badge').textContent = evt.severity;
    document.getElementById('event-icon').textContent = evt.icon;
    document.getElementById('event-title').textContent = evt.title;
    document.getElementById('event-desc').textContent = evt.desc;

    const optCont = document.getElementById('event-options');
    optCont.innerHTML = '';

    evt.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'event-option-btn';
      btn.innerHTML = `${opt.label}<span class="opt-cost">${opt.cost}</span>`;
      btn.onclick = () => {
        opt.apply(state);
        clampState();
        closeModal('modal-event');
        renderGame();
        if (callback) callback();
      };
      optCont.appendChild(btn);
    });

    document.getElementById('modal-event').style.display = 'flex';
  }

  // ─────────────────────────────────────────────
  //  Modal de Orçamento Participativo
  // ─────────────────────────────────────────────
  function showBudgetModal() {
    // Sortear 3 opções únicas do pool
    const shuffled = [...BUDGET_OPTIONS_POOL].sort(() => Math.random() - 0.5).slice(0, 3);

    const cont = document.getElementById('budget-options');
    cont.innerHTML = '';

    shuffled.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'budget-option-btn';
      btn.innerHTML = `
        <div class="budget-option-title">${opt.title}</div>
        <div class="budget-option-desc">${opt.desc}</div>
        <div class="budget-option-cost">${opt.cost}</div>
      `;
      btn.onclick = () => {
        opt.apply(state);
        clampState();
        closeModal('modal-budget');
        renderGame();
        advanceTurn();
      };
      cont.appendChild(btn);
    });

    document.getElementById('modal-budget').style.display = 'flex';
  }

  // ─────────────────────────────────────────────
  //  Fim de Jogo
  // ─────────────────────────────────────────────
  function endGame(reason) {
    if (tickerTimer) clearInterval(tickerTimer);

    const pop = Math.round(clamp(state.popularidade, 0, 100));
    const caixa = state.caixa;
    const stab = Math.round(clamp(state.estabilidade_social, 0, 100));
    const leg = Math.round(clamp(state.apoio_legislativo, 0, 100));

    // Calcular avaliação
    let score = 0;
    score += pop * 0.5;
    score += (caixa > 0 ? 25 : Math.max(0, 15 + caixa / 2000000));
    score += stab * 0.15;
    score += leg * 0.1;

    let tier, tierId;
    if (reason === 'impeached' || score < 25) {
      tier = 'FRACASSO'; tierId = 'fracasso';
    } else if (score < 50) {
      tier = 'REGULAR'; tierId = 'regular';
    } else if (score < 72) {
      tier = 'BOM'; tierId = 'bom';
    } else {
      tier = 'EXCELENTE'; tierId = 'excelente';
    }

    const verdicts = VERDICTS[tierId];
    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];

    showScreen('screen-end');

    const badge = document.getElementById('end-badge');
    badge.textContent = tier;
    badge.className = 'end-badge ' + tierId;

    document.getElementById('end-title').textContent =
      reason === 'impeached' ? 'Impeachment! Mandato Encerrado' : 'Mandato Concluído';

    document.getElementById('end-pop').textContent = pop;
    document.getElementById('end-caixa').textContent = formatMoney(caixa);
    document.getElementById('end-stab').textContent = stab;
    document.getElementById('end-leg').textContent = leg;
    document.getElementById('end-verdict').textContent = verdict;
  }

  // ─────────────────────────────────────────────
  //  Reiniciar
  // ─────────────────────────────────────────────
  function restart() {
    selectedPriorities.length = 0;
    document.querySelectorAll('.priority-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('selected-count').textContent = '0 / 3 selecionadas';
    document.getElementById('btn-start-game').disabled = true;
    showScreen('screen-setup');
  }

  // ─────────────────────────────────────────────
  //  Toast Notification
  // ─────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg, type = 'neutral') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type} show`;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
  }

  // ─────────────────────────────────────────────
  //  Boot
  // ─────────────────────────────────────────────
  function boot() {
    showScreen('screen-intro');
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // API pública
  return {
    goToSetup,
    togglePriority,
    startGame,
    makeDecision,
    nextTurn,
    closeModal,
    restart,
  };

})();
