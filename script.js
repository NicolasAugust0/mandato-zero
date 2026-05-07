'use strict';

const Game = (() => {
  const MAX_TURNOS = 16;
  const PRIORITY_META = {
    saude: { nome: 'Saúde', icon: '🏥' },
    educacao: { nome: 'Educação', icon: '📚' },
    seguranca: { nome: 'Segurança', icon: '🛡️' },
    infraestrutura: { nome: 'Infraestrutura', icon: '🏗️' },
    economia: { nome: 'Economia', icon: '💰' },
  };

  const BUDGET_DEMANDS = [
    { id: 'ubs', titulo: 'Expandir UBS', desc: 'Reforça atendimento de base e reduz desgaste social.', custo: 2500000, efeitos: { popularidade: 6, estabilidade_social: 5 } },
    { id: 'merenda', titulo: 'Merenda e escolas', desc: 'Atende demanda imediata da população estudantil.', custo: 1800000, efeitos: { popularidade: 4, estabilidade_social: 4, apoio_legislativo: 1 } },
    { id: 'transporte', titulo: 'Subsídio no transporte', desc: 'Alivia pressão urbana e melhora mobilidade.', custo: 2200000, efeitos: { popularidade: 5, estabilidade_social: 3 } },
    { id: 'saneamento', titulo: 'Saneamento periférico', desc: 'Gera resultado estrutural com efeito de médio prazo.', custo: 2800000, efeitos: { popularidade: 3, estabilidade_social: 6 } },
    { id: 'seguranca-bairro', titulo: 'Iluminação e patrulha', desc: 'Reage à insegurança em áreas críticas.', custo: 2300000, efeitos: { popularidade: 4, estabilidade_social: 5 } },
  ];

  const EVENTS = [
    {
      severity: 'CRISE SOCIAL',
      icon: '✊',
      title: 'Greve nacional pressiona o governo',
      desc: 'Servidores e sindicatos pedem reajuste e ameaçam paralisar serviços essenciais.',
      options: [
        { label: 'Abrir negociação e reajustar parte dos salários', cost: '−R$ 3 mi | +Estabilidade', apply: s => { s.caixa -= 3000000; s.estabilidade_social += 8; s.popularidade += 4; s.apoio_legislativo -= 2; } },
        { label: 'Manter austeridade e endurecer discurso', cost: '+R$ 1 mi | −Popularidade', apply: s => { s.caixa += 1000000; s.estabilidade_social -= 10; s.popularidade -= 6; s.tensao_global += 4; } },
      ],
    },
    {
      severity: 'CRISE GLOBAL',
      icon: '🌐',
      title: 'Escalada internacional aumenta a tensão',
      desc: 'Mercados reagem mal e a tensão global ameaça contaminar o cenário interno.',
      options: [
        { label: 'Convocar cúpula diplomática e buscar acordo', cost: '−R$ 2 mi | −Tensão', apply: s => { s.caixa -= 2000000; s.tensao_global -= 12; s.apoio_legislativo += 3; } },
        { label: 'Reforçar defesa interna e monitoramento', cost: '−R$ 1 mi | +Estabilidade', apply: s => { s.caixa -= 1000000; s.estabilidade_social += 5; s.tensao_global -= 4; } },
      ],
    },
    {
      severity: 'CRISE POLÍTICA',
      icon: '📰',
      title: 'Escândalo ministerial domina o noticiário',
      desc: 'Aliados divergem sobre como responder ao desgaste provocado por denúncias.',
      options: [
        { label: 'Exonerar ministro e assumir custo político', cost: '+Popularidade | −Legislativo', apply: s => { s.popularidade += 7; s.apoio_legislativo -= 7; } },
        { label: 'Blindar aliado e manter base unida', cost: '+Legislativo | −Popularidade', apply: s => { s.popularidade -= 8; s.apoio_legislativo += 5; s.estabilidade_social -= 4; } },
      ],
    },
    {
      severity: 'EMERGÊNCIA',
      icon: '🌧️',
      title: 'Chuvas severas atingem regiões estratégicas',
      desc: 'A população cobra resposta rápida para evitar colapso local e perda de apoio.',
      options: [
        { label: 'Mobilizar ajuda federal e reconstrução imediata', cost: '−R$ 4 mi | +Pop', apply: s => { s.caixa -= 4000000; s.popularidade += 8; s.estabilidade_social += 6; } },
        { label: 'Liberar verba parcial e priorizar contenção', cost: '−R$ 1 mi | −Estabilidade', apply: s => { s.caixa -= 1000000; s.popularidade -= 5; s.estabilidade_social -= 7; } },
      ],
    },
    {
      severity: 'SEGURANÇA',
      icon: '🚨',
      title: 'Ataques coordenados elevam sensação de insegurança',
      desc: 'O governo precisa decidir entre resposta dura imediata ou prevenção social.',
      options: [
        { label: 'Operação intensiva com reforço policial', cost: '−R$ 3 mi | +Estabilidade', apply: s => { s.caixa -= 3000000; s.estabilidade_social += hasPriority('seguranca') ? 12 : 8; s.popularidade += 3; } },
        { label: 'Plano social de prevenção e inteligência', cost: '−R$ 2 mi | +Popularidade', apply: s => { s.caixa -= 2000000; s.estabilidade_social += hasPriority('educacao') ? 7 : 4; s.popularidade += hasPriority('saude') ? 7 : 5; } },
      ],
    },
  ];

  let selectedPriorities = [];
  let state = {};
  let lastNews = 'Novo governo toma posse prometendo reformas e equilíbrio fiscal.';
  let modalLocked = false;

  function hasPriority(priority) {
    return state.prioridades?.includes(priority);
  }

  function initState(prioridades) {
    state = {
      turno: 1,
      prioridades: [...prioridades],
      popularidade: 60,
      caixa: -10000000,
      apoio_legislativo: 50,
      estabilidade_social: 70,
      tensao_global: 10,
      actionTaken: false,
      currentAction: null,
      budgetUsed: false,
    };

    if (hasPriority('saude')) state.popularidade += 10;
    if (hasPriority('educacao')) state.estabilidade_social += 8;
    if (hasPriority('seguranca')) state.estabilidade_social += 4;
    if (hasPriority('infraestrutura')) state.caixa += 1000000;
    if (hasPriority('economia')) {
      state.caixa = Math.round(state.caixa * 0.8);
      state.apoio_legislativo += 8;
    }

    clampState();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clampState() {
    state.popularidade = clamp(state.popularidade, 0, 100);
    state.apoio_legislativo = clamp(state.apoio_legislativo, 0, 100);
    state.estabilidade_social = clamp(state.estabilidade_social, 0, 100);
    state.tensao_global = clamp(state.tensao_global, 0, 100);
  }

  function money(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }

  function yearLabel(turno) {
    return `ANO ${Math.ceil(turno / 4)}`;
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.toggle('active', screen.id === id);
    });
  }

  function goToSetup() {
    showScreen('screen-setup');
  }

  function togglePriority(card) {
    const priority = card.dataset.priority;
    if (card.classList.contains('selected')) {
      card.classList.remove('selected');
      selectedPriorities = selectedPriorities.filter(item => item !== priority);
    } else {
      if (selectedPriorities.length >= 3) {
        showToast('Escolha somente 3 prioridades de governo.', 'warning');
        return;
      }
      card.classList.add('selected');
      selectedPriorities.push(priority);
    }

    document.getElementById('selected-count').textContent = `${selectedPriorities.length} / 3 selecionadas`;
    document.getElementById('btn-start-game').disabled = selectedPriorities.length !== 3;
  }

  function startGame() {
    if (selectedPriorities.length !== 3) return;
    initState(selectedPriorities);
    lastNews = `Posse concluída: foco do governo em ${selectedPriorities.map(p => PRIORITY_META[p].nome).join(', ')}.`;
    showScreen('screen-game');
    render();
    showToast('Mandato iniciado. Escolha uma ação para o 1º trimestre.', 'positive');
  }

  function getActionRules(tipo) {
    const investCost = hasPriority('saude') ? 1500000 : 2000000;
    const rules = {
      cortar: {
        label: 'Corte de gastos aprovado.',
        tone: 'warning',
        requiresLeg: false,
        apply: () => {
          state.caixa += 3000000;
          state.popularidade -= 8;
          state.estabilidade_social -= 3;
        },
      },
      imposto: {
        label: 'Carga tributária elevada para reforçar caixa.',
        tone: 'warning',
        requiresLeg: false,
        apply: () => {
          state.caixa += 5000000;
          state.popularidade -= 12;
          state.apoio_legislativo -= 5;
        },
      },
      investir: {
        label: 'Investimento em serviços públicos executado.',
        tone: 'positive',
        minLeg: 45,
        requiresLeg: true,
        apply: () => {
          state.caixa -= investCost;
          state.popularidade += 10;
          state.estabilidade_social += hasPriority('educacao') ? 8 : 6;
          if (hasPriority('saude')) state.popularidade += 2;
        },
      },
      emprestimo: {
        label: 'Crédito emergencial contratado.',
        tone: 'warning',
        minLeg: 40,
        requiresLeg: true,
        apply: () => {
          state.caixa += 12000000;
          state.apoio_legislativo -= 7;
          state.tensao_global += 5;
        },
      },
      diplomacia: {
        label: 'A ofensiva diplomática reduziu tensões.',
        tone: 'positive',
        requiresLeg: false,
        apply: () => {
          state.caixa -= 2000000;
          state.tensao_global -= 12;
          state.apoio_legislativo += 3;
        },
      },
      negociar: {
        label: 'Você negociou com o congresso.',
        tone: 'positive',
        requiresLeg: false,
        apply: () => {
          state.apoio_legislativo += 12;
          state.caixa -= 1500000;
          if (Math.random() < 0.3) {
            state.popularidade -= 6;
            showToast('O acordo gerou desgaste com parte da base social.', 'warning');
          }
        },
      },
    };

    return rules[tipo];
  }

  function makeDecision(tipo) {
    if (modalLocked || state.actionTaken) {
      return;
    }

    const rules = getActionRules(tipo);
    if (!rules) return;

    if (rules.requiresLeg && state.apoio_legislativo < (rules.minLeg || 50)) {
      document.getElementById('blocked-leg-val').textContent = Math.round(state.apoio_legislativo);
      document.getElementById('modal-blocked').style.display = 'flex';
      return;
    }

    rules.apply();
    clampState();
    state.actionTaken = true;
    state.currentAction = tipo;
    lastNews = rules.label;
    render();
    showToast(rules.label, rules.tone);
  }

  function applyPassiveEffects() {
    const tensionDrift = 3 + Math.floor(Math.random() * 4);
    state.tensao_global += tensionDrift;
    state.caixa -= 1200000;

    if (hasPriority('infraestrutura')) state.caixa += 700000;
    if (hasPriority('economia')) state.caixa += 500000;

    if (state.estabilidade_social > 75) state.tensao_global -= 2;
    if (state.tensao_global > 65) {
      state.popularidade -= 4;
      state.estabilidade_social -= 4;
    } else if (state.tensao_global > 40) {
      state.popularidade -= 2;
      state.estabilidade_social -= 2;
    } else {
      state.popularidade += 1;
    }

    if (state.caixa < -15000000) state.popularidade -= 3;
    if (state.caixa > 5000000) state.popularidade += 1;

    if (state.apoio_legislativo < 35) state.popularidade -= 1;
    if (hasPriority('educacao')) state.estabilidade_social += 1;

    clampState();
  }

  function nextTurn() {
    if (modalLocked) return;

    if (!state.actionTaken) {
      showToast('Escolha uma ação antes de avançar o trimestre.', 'warning');
      return;
    }

    applyPassiveEffects();
    state.turno += 1;
    state.actionTaken = false;
    state.currentAction = null;

    if (state.turno > MAX_TURNOS) {
      endGame();
      return;
    }

    lastNews = `Trimestre ${state.turno - 1} encerrado. Novas pressões surgem sobre o governo.`;
    render();

    if (state.turno % 4 === 0 && !state.budgetUsed) {
      openBudgetModal();
      return;
    }

    if (Math.random() < 0.55) {
      openRandomEvent();
    }
  }

  function pickRandomItems(list, count) {
    const pool = [...list];
    const chosen = [];
    while (pool.length && chosen.length < count) {
      const index = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(index, 1)[0]);
    }
    return chosen;
  }

  function applyEffects(effects) {
    Object.entries(effects).forEach(([key, value]) => {
      state[key] += value;
    });
    clampState();
  }

  function openBudgetModal() {
    modalLocked = true;
    const optionsEl = document.getElementById('budget-options');
    const options = pickRandomItems(BUDGET_DEMANDS, 3);

    optionsEl.innerHTML = '';
    options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'budget-option-btn';
      button.innerHTML = `
        <div class="budget-option-title">${option.titulo}</div>
        <div class="budget-option-desc">${option.desc}</div>
        <div class="budget-option-cost">Custo: ${money(option.custo)}</div>
      `;
      button.onclick = () => {
        state.caixa -= option.custo;
        applyEffects(option.efeitos);
        if (hasPriority('saude') && option.id === 'ubs') state.popularidade += 2;
        if (hasPriority('educacao') && option.id === 'merenda') state.estabilidade_social += 2;
        if (hasPriority('infraestrutura') && option.id === 'saneamento') state.popularidade += 1;
        clampState();
        state.budgetUsed = true;
        lastNews = `Orçamento participativo aprovado: ${option.titulo}.`;
        closeModal('modal-budget');
        render();
        showToast('Demanda popular atendida.', 'positive');
      };
      optionsEl.appendChild(button);
    });

    document.getElementById('modal-budget').style.display = 'flex';
  }

  function openRandomEvent() {
    modalLocked = true;
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    document.getElementById('event-severity-badge').textContent = event.severity;
    document.getElementById('event-icon').textContent = event.icon;
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-desc').textContent = event.desc;

    const optionsContainer = document.getElementById('event-options');
    optionsContainer.innerHTML = '';

    event.options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'event-option-btn';
      button.innerHTML = `${option.label}<span class="opt-cost">${option.cost}</span>`;
      button.onclick = () => {
        option.apply(state);
        clampState();
        lastNews = `${event.title} — resposta escolhida: ${option.label}.`;
        closeModal('modal-event');
        render();
        showToast('Resposta ao evento registrada.', 'positive');
      };
      optionsContainer.appendChild(button);
    });

    document.getElementById('modal-event').style.display = 'flex';
  }

  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    modalLocked = false;
  }

  function getBadge(score) {
    if (score >= 78) return { classe: 'excelente', texto: 'EXCELENTE', titulo: 'Mandato histórico' };
    if (score >= 60) return { classe: 'bom', texto: 'BOM', titulo: 'Mandato competitivo' };
    if (score >= 42) return { classe: 'regular', texto: 'REGULAR', titulo: 'Mandato sobrevivente' };
    return { classe: 'fracasso', texto: 'CRÍTICO', titulo: 'Mandato em crise' };
  }

  function endGame() {
    const caixaScore = state.caixa > 0 ? 22 : clamp(12 + state.caixa / 2000000, 0, 22);
    const tensaoScore = clamp(20 - (state.tensao_global * 0.2), 0, 20);
    const popularidadeScore = state.popularidade * 0.45;
    const estabilidadeScore = state.estabilidade_social * 0.2;
    const legislativoScore = state.apoio_legislativo * 0.13;
    const score = popularidadeScore + estabilidadeScore + legislativoScore + caixaScore + tensaoScore;

    const badge = getBadge(score);
    const badgeEl = document.getElementById('end-badge');
    badgeEl.className = `end-badge ${badge.classe}`;
    badgeEl.textContent = badge.texto;
    document.getElementById('end-title').textContent = badge.titulo;

    document.getElementById('end-pop').textContent = `${Math.round(state.popularidade)}/100`;
    document.getElementById('end-caixa').textContent = money(state.caixa);
    document.getElementById('end-stab').textContent = `${Math.round(state.estabilidade_social)}/100`;
    document.getElementById('end-leg').textContent = `${Math.round(state.apoio_legislativo)}/100`;

    document.getElementById('end-verdict').textContent =
      `Seu governo terminou com ${Math.round(state.popularidade)} de aprovação, ${Math.round(state.estabilidade_social)} de estabilidade e ${Math.round(state.tensao_global)} de tensão global.`;

    document.getElementById('end-score-breakdown').innerHTML = `
      <div class="score-title">Critério de avaliação</div>
      <div class="score-line"><span>Popularidade</span><strong>${popularidadeScore.toFixed(1)}</strong></div>
      <div class="score-line"><span>Caixa</span><strong>${caixaScore.toFixed(1)}</strong></div>
      <div class="score-line"><span>Estabilidade</span><strong>${estabilidadeScore.toFixed(1)}</strong></div>
      <div class="score-line"><span>Legislativo</span><strong>${legislativoScore.toFixed(1)}</strong></div>
      <div class="score-line"><span>Controle da tensão global</span><strong>${tensaoScore.toFixed(1)}</strong></div>
      <div class="score-total"><span>Pontuação final</span><strong>${score.toFixed(1)}</strong></div>
    `;

    showScreen('screen-end');
  }

  function render() {
    document.getElementById('mandate-year').textContent = yearLabel(state.turno);
    document.getElementById('turn-display').textContent = state.turno;
    document.getElementById('caixa-display').textContent = money(state.caixa);
    document.getElementById('caixa-display').classList.toggle('negative', state.caixa < 0);

    const metrics = [
      ['pop', state.popularidade],
      ['leg', state.apoio_legislativo],
      ['stab', state.estabilidade_social],
      ['tens', state.tensao_global],
    ];

    metrics.forEach(([key, value]) => {
      document.getElementById(`val-${key}`).textContent = Math.round(value);
      document.getElementById(`bar-${key}`).style.width = `${clamp(value, 0, 100)}%`;
    });

    document.getElementById('tension-mini').style.width = `${clamp(state.tensao_global, 0, 100)}%`;
    document.getElementById('ticker-text').textContent = lastNews;

    const prioritiesEl = document.getElementById('active-priorities');
    prioritiesEl.innerHTML = state.prioridades
      .map(priority => `<span class="priority-chip">${PRIORITY_META[priority].icon} ${PRIORITY_META[priority].nome}</span>`)
      .join('');

    document.querySelectorAll('.decision-btn[data-action]').forEach(button => {
      const disabled = state.actionTaken;
      button.disabled = disabled;
      button.classList.toggle('disabled', disabled);
    });

    const advanceLabel = state.actionTaken ? 'AVANÇAR TRIMESTRE →' : 'ESCOLHA UMA AÇÃO PRIMEIRO';
    document.getElementById('btn-advance').textContent = advanceLabel;
  }

  let toastTimer;
  function showToast(msg, tone = 'positive') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${tone}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.className = 'toast';
    }, 2400);
  }

  function restart() {
    selectedPriorities = [];
    modalLocked = false;
    lastNews = 'Novo governo toma posse prometendo reformas e equilíbrio fiscal.';

    document.querySelectorAll('.priority-card').forEach(card => card.classList.remove('selected'));
    document.getElementById('selected-count').textContent = '0 / 3 selecionadas';
    document.getElementById('btn-start-game').disabled = true;
    closeModal('modal-event');
    closeModal('modal-budget');
    closeModal('modal-blocked');
    showScreen('screen-intro');
  }

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
