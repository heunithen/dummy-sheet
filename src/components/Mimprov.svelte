<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';
  import { PartyStore, currentPlayerId, isGM } from '../services/OBRHelper';
  import { getNameOptions } from '../data/name-library';
  import { getConceptOptions } from '../data/concept-library';
  import { APPEARANCE_AGES, getAppearanceOptions, type AppearanceAge, type AppearanceGender } from '../data/appearance-library';

  const DATA_KEY = 'com.heunithen.dummysheet-mimprov/sheet';
  const STATE_KEY = 'com.heunithen.dummysheet-mimprov/player-states';
  const OVEREXERTION_KEY = 'com.heunithen.dummysheet-mimprov/player-overexertion';
  const CONFLICT_KEY = 'com.heunithen.dummysheet-mimprov/conflict';
  const EFFORT_REQUEST_CHANNEL = 'com.heunithen.dummysheet-mimprov/spend-effort';
  const REST_REQUEST_CHANNEL = 'com.heunithen.dummysheet-mimprov/rest';
  const DICE_PLUS_SOURCE = 'com.heunithen.dummysheet-mimprov';
  const DELETE_CHARACTER_CHANNEL = 'com.heunithen.dummysheet-mimprov/delete-character';
  const MAGIC_KEY = 'com.heunithen.dummysheet-mimprov/magic-pacts';
  const PLAYER_MAGIC_KEY = 'com.heunithen.dummysheet-mimprov/player-magic';
  const MAGIC_SUBMIT_CHANNEL = 'com.heunithen.dummysheet-mimprov/magic-submit';
  const MAGIC_APPROVED_CHANNEL = 'com.heunithen.dummysheet-mimprov/magic-approved';
  const STATES = [
    { name: 'Mermado', enfoque: 'Rapidez', detail: 'Lesión o limitación física.' },
    { name: 'Deprimido', enfoque: 'Tenacidad', detail: 'Enfermedad, intoxicación o debilidad.' },
    { name: 'Ansioso', enfoque: 'Control', detail: 'Miedo, terror o intimidación.' },
    { name: 'Confundido', enfoque: 'Astucia', detail: 'Percepción o pensamiento alterados.' },
    { name: 'Incapacitado', enfoque: 'Todos', detail: 'Fuera de acción; requiere resolución narrativa.' }
  ];
  const APPROACHES = ['Tenacidad', 'Control', 'Astucia', 'Rapidez'];
  const TRAITS = [
    'Atlético', 'Conocedor de...', 'Espadachín', 'Investigador', 'Furtivo',
    'Intimidante', 'Liderazgo', 'Maestro Chasquilla', 'Observador',
    'Peleador', 'Persuasivo', 'Superviviente', 'Tirador'
  ];
  const APPROACH_DESCRIPTIONS: Record<string, { long: string; short: string }> = {
    Tenacidad: {
      long: 'Representa la resistencia física y mental, la determinación y la capacidad de soportar presión. Se utiliza para aguantar dolor, cansancio, privaciones o situaciones extremas, mantener el esfuerzo pese a las dificultades y no ceder ante amenazas, sufrimiento o adversidad.',
      short: 'Resistir, soportar presión y mantener la determinación.'
    },
    Control: {
      long: 'Representa la disciplina, la precisión y la capacidad de actuar con calma. Se utiliza para ejecutar acciones delicadas, mantener la concentración, controlar los movimientos o las emociones y realizar tareas que requieren cuidado, coordinación y dominio de uno mismo.',
      short: 'Actuar con calma, precisión y disciplina.'
    },
    Astucia: {
      long: 'Representa la inteligencia práctica, la observación analítica y la capacidad de encontrar soluciones. Se utiliza para deducir, investigar, recordar información útil, detectar patrones, engañar, improvisar estrategias o resolver problemas mediante el ingenio.',
      short: 'Analizar, deducir y encontrar soluciones ingeniosas.'
    },
    Rapidez: {
      long: 'Representa la velocidad de reacción, la agilidad y la capacidad de moverse con rapidez. Se utiliza para correr, esquivar, perseguir, escapar, reaccionar antes que otros y realizar acciones que dependen de la velocidad o los reflejos.',
      short: 'Moverse con agilidad y reaccionar rápidamente.'
    }
  };
  const TRAIT_DESCRIPTIONS: Record<string, { long: string; short: string }> = {
    'Atlético': {
      long: 'Tienes una buena condición física y sabes aprovechar tu fuerza, resistencia y coordinación. Este Rasgo resulta útil al correr, saltar, trepar, nadar, mantener esfuerzos físicos prolongados o superar obstáculos que exigen preparación corporal.',
      short: 'Aprovechar tu condición física para superar desafíos corporales.'
    },
    'Conocedor de...': {
      long: 'Posees conocimientos y experiencia en un campo específico que defines al elegir el Rasgo. Puedes reconocer elementos propios de esa materia, comprender información especializada, recordar procedimientos y resolver problemas relacionados con ese ámbito.',
      short: 'Aplicar conocimientos y experiencia en el campo que definiste.'
    },
    'Espadachín': {
      long: 'Tienes entrenamiento y experiencia en el uso de espadas. Sabes manejar este tipo de arma, medir distancias, encontrar aperturas y aprovechar sus características en un enfrentamiento o en otras situaciones donde sea relevante tu dominio de la espada.',
      short: 'Usar espadas con técnica y experiencia.'
    },
    'Investigador': {
      long: 'Sabes buscar información, examinar indicios y reconstruir lo ocurrido a partir de pistas. Puedes interrogar, comparar testimonios, revisar documentos, relacionar detalles y seguir un método para descubrir respuestas que no son evidentes.',
      short: 'Buscar pistas, analizar indicios y reconstruir información.'
    },
    'Furtivo': {
      long: 'Sabes evitar llamar la atención y desplazarte sin ser detectado. Puedes ocultarte, moverte en silencio, aprovechar sombras y coberturas, infiltrarte o pasar inadvertido cuando la situación permite actuar con discreción.',
      short: 'Ocultarte, infiltrarte y actuar sin llamar la atención.'
    },
    'Intimidante': {
      long: 'Proyectas una presencia amenazante y sabes utilizarla para imponer respeto o temor. Puedes presionar a otros mediante tu actitud, reputación, aspecto o palabras, haciendo evidente que enfrentarte o contrariarte puede tener consecuencias.',
      short: 'Imponer temor o presión mediante tu presencia.'
    },
    'Liderazgo': {
      long: 'Sabes organizar, dirigir y coordinar a otras personas. Puedes transmitir instrucciones, mantener unido a un grupo, distribuir responsabilidades, tomar la iniciativa y orientar los esfuerzos colectivos hacia un objetivo común.',
      short: 'Dirigir, coordinar y mantener unido a un grupo.'
    },
    'Maestro Chasquilla': {
      long: 'Tienes habilidad práctica para reparar, adaptar, montar y construir cosas con los materiales y herramientas disponibles. Puedes improvisar arreglos, comprender mecanismos sencillos y encontrar soluciones manuales cuando no cuentas con el equipo ideal.',
      short: 'Reparar, adaptar e improvisar soluciones prácticas.'
    },
    'Observador': {
      long: 'Prestas atención a los detalles del entorno y sabes percibir aquello que otros pasan por alto. Puedes advertir movimientos, cambios, objetos fuera de lugar, señales sutiles o comportamientos extraños antes de que resulten evidentes.',
      short: 'Percibir detalles y notar cambios en el entorno.'
    },
    'Peleador': {
      long: 'Tienes experiencia enfrentándote físicamente a otras personas, especialmente en combate cuerpo a cuerpo. Sabes golpear, forcejear, derribar, defenderte y aprovechar tu cuerpo en una pelea sin depender necesariamente de armas.',
      short: 'Enfrentarte a otros cuerpo a cuerpo.'
    },
    'Persuasivo': {
      long: 'Sabes comunicarte para convencer, negociar y conseguir la cooperación de otras personas. Puedes argumentar, generar confianza, presentar propuestas de manera convincente y adaptar tu discurso a lo que le importa a tu interlocutor.',
      short: 'Convencer, negociar y conseguir la cooperación de otros.'
    },
    'Superviviente': {
      long: 'Sabes desenvolverte en entornos difíciles y cubrir necesidades básicas cuando faltan comodidades o recursos. Puedes orientarte, encontrar refugio, reconocer peligros naturales, conseguir recursos y tomar precauciones para mantenerte a salvo.',
      short: 'Orientarte y mantenerte a salvo en entornos difíciles.'
    },
    'Tirador': {
      long: 'Tienes práctica con armas a distancia y sabes apuntar, calcular trayectorias y elegir el momento adecuado para disparar o lanzar. Este Rasgo representa tu experiencia al atacar objetivos que se encuentran fuera del alcance cuerpo a cuerpo.',
      short: 'Apuntar y atacar con armas a distancia.'
    }
  };
  const EQUIPMENT: Record<string, string[]> = {
    'Atlético': ['Cuerda', 'Guantes de agarre', 'Botella de agua'],
    'Conocedor de...': ['Cuaderno de referencia', 'Instrumento de medición', 'Kit básico de trabajo'],
    'Espadachín': ['Espada', 'Escudo', 'Vaina'],
    'Furtivo': ['Capa con capucha', 'Ropa oscura', 'Herramientas de apertura sencillas'],
    'Intimidante': ['Vestimenta intimidante', 'Insignia o símbolo de autoridad', 'Accesorio amenazante'],
    'Maestro Chasquilla': ['Juego de herramientas manuales', 'Alicates', 'Cinta métrica'],
    'Observador': ['Lupa', 'Linterna', 'Espejo de inspección'],
    'Peleador': ['Guantes de combate', 'Vendas para las manos', 'Protector corporal ligero'],
    'Persuasivo': ['Vestimenta apropiada para negociar', 'Documento o credencial de presentación', 'Objeto de intercambio o cortesía'],
    'Tirador': ['Arco', 'Carcaj', 'Flechas'],
    'Investigador': ['', '', ''],
    'Liderazgo': ['', '', ''],
    'Superviviente': ['', '', '']
  };

  type Item = { id: number; name: string; trait: string };
  type Character = {
    name: string; concept: string; age: string; appearance: string; experience: string; notes: string;
    approaches: Record<string, number>; traits: string[]; inventory: Item[];
    will: number; maxWill: number; created: boolean;
  };
  const blankCharacter = (): Character => ({
    name: '', concept: '', age: '', appearance: '', experience: '', notes: '',
    approaches: { Tenacidad: 0, Control: 0, Astucia: 0, Rapidez: 0 },
    traits: [], inventory: [], will: 4, maxWill: 4, created: false
  });

  let character: Character = blankCharacter();
  let loaded = false;
  let step = 0;
  let nameStyle = 'fantasy';
  let nameGender = 'masculine';
  $: nameOptions = getNameOptions(nameStyle, nameGender);
  function generateRandomName() {
    if (!nameOptions.length) return;
    character.name = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    updateCharacter();
  }
  let conceptGenre = 'fantasy';
  $: conceptOptions = getConceptOptions(conceptGenre);
  let appearanceAge: AppearanceAge = 'young';
  let appearanceGender: AppearanceGender = 'male';
  $: appearanceOptions = getAppearanceOptions(appearanceAge, appearanceGender);
  function syncAppearanceAge() {
    character.age = APPEARANCE_AGES.find((age) => age.value === appearanceAge)?.label || '';
  }
  function generateRandomAppearance() {
    if (!appearanceOptions.length) return;
    character.appearance = appearanceOptions[Math.floor(Math.random() * appearanceOptions.length)];
    updateCharacter();
  }
  function generateRandomConcept() {
    if (!conceptOptions.length) return;
    character.concept = conceptOptions[Math.floor(Math.random() * conceptOptions.length)];
  }
  let approachDraft: Record<string, number> = { Tenacidad: 0, Control: 0, Astucia: 0, Rapidez: 0 };
  let traitDraft = '';
  let customTraitField = '';
  let equipmentDraft: string[] = [];
  let editingCharacter = false;
  let activeTab = 'personaje';
  let magicData: any = { players: {} };
  let playerMagicRecord: any = { spells: [] };
  let magicEffect = '';
  let magicPrice = '';
  let magicMessage = '';
  let gmTracker: any = { players: {}, conflict: { active: false, danger: 'Bajo', resistance: null } };
  let conflictActive = false;
  let conflictDanger = 'Bajo';
  let gmLoaded = false;
  let visibleStates: string[] = [];
  let visibleOverexertionUsed = 0;
  let selectedPlayerId = '';
  let selectedApproach = 'Tenacidad';
  let selectedTrait = '';
  let selectedState = '';
  let rollModifier = 'normal';
  let lastRoll: { dice: number[]; kept: number; pool: number; result: string; critical: boolean; notation?: string; summary?: string } | null = null;
  let dicePlusError = '';
  let pendingDiceRoll: { rollId: string; pool: number; notation: string; approach: string; effortReroll: boolean; conflictActive: boolean; danger: string } | null = null;

  $: approachTotal = APPROACHES.reduce((sum, name) => sum + (Number(approachDraft[name]) || 0), 0);
  $: approachValid = approachTotal === 4 && APPROACHES.every(name => approachDraft[name] >= 0 && approachDraft[name] <= 2);
  $: myPlayer = $PartyStore.find(p => p.id === $currentPlayerId);
  // El rol llega de forma asíncrona desde Owlbear. Asegura una pestaña válida al cambiar de rol.
  $: if ($isGM && activeTab !== 'gm' && activeTab !== 'conflicto' && activeTab !== 'reglamento' && activeTab !== 'magia-gm') activeTab = 'gm';
  $: if (!$isGM && (activeTab === 'gm' || activeTab === 'conflicto' || activeTab === 'magia-gm')) activeTab = 'personaje';
  $: partyMembers = $PartyStore.filter(p => p.role !== 'GM' && getPlayerCharacter(p)?.created === true);
  $: if ($isGM && partyMembers.length && !partyMembers.some(p => p.id === selectedPlayerId)) selectedPlayerId = partyMembers[0].id;
  $: selectedPlayer = partyMembers.find(p => p.id === selectedPlayerId);
  $: selectedCharacter = selectedPlayer?.metadata?.[DATA_KEY] as Character;
  $: createdCharacterCount = partyMembers.filter(p => getPlayerCharacter(p)?.created).length;
  $: initialConflictResistance = createdCharacterCount * 2;
  $: if ($isGM && gmTracker.conflict?.active && partyMembers.length > 0 && partyMembers.every((player) => (Number(getPlayerCharacter(player)?.will) || 0) <= 0)) resolveConflict('defeat');

  function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
  function getStoredCharacter(): Character {
    try {
      const raw = localStorage.getItem('mimprov-character-v1');
      return raw ? { ...blankCharacter(), ...JSON.parse(raw) } : blankCharacter();
    } catch { return blankCharacter(); }
  }
  function saveLocalCharacter() {
    localStorage.setItem('mimprov-character-v1', JSON.stringify(character));
  }
  let saveTimer: any;
  function publishCharacter() {
    saveLocalCharacter();
    if (!OBR.isAvailable || !loaded || !$currentPlayerId || $isGM) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try { await OBR.player.setMetadata({ [DATA_KEY]: clone(character) }); }
      catch (error) { console.error('No se pudo sincronizar la ficha MIMPROV', error); }
    }, 180);
  }
  function updateCharacter() { character = clone(character); publishCharacter(); }

  function getMyMagicRecord() {
    return {
      proposals: magicData?.players?.[$currentPlayerId]?.proposals || [],
      spells: playerMagicRecord?.spells || []
    };
  }
  async function submitMagicPact() {
    const effect = magicEffect.trim();
    const price = magicPrice.trim();
    if (!effect || !price) { magicMessage = 'Completa ambos campos antes de firmar el pacto.'; return; }
    if (!OBR.isAvailable || !$currentPlayerId || $isGM) { magicMessage = 'Debes estar dentro de una sala de Owlbear Rodeo como jugador para enviar el pacto.'; return; }
    const pact = { id: 'pact_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), effect, price, status: 'pending', createdAt: Date.now() };
    try {
      await OBR.broadcast.sendMessage(MAGIC_SUBMIT_CHANNEL, { playerId: $currentPlayerId, playerName: myPlayer?.name || character.name || 'Jugador', pact }, { destination: 'ALL' });
      magicEffect = ''; magicPrice = ''; magicMessage = 'Pacto firmado y enviado al GM para su revisión.';
    } catch (error) { console.error('No se pudo enviar el pacto mágico', error); magicMessage = 'No se pudo enviar el pacto. Comprueba tu conexión con Owlbear Rodeo.'; }
  }
  async function updateMagicPact(playerId: string, pactId: string, decision: 'accepted' | 'rejected') {
    if (!$isGM || !OBR.isAvailable) return;
    const next = clone(magicData || { players: {} }); if (!next.players) next.players = {};
    const record = next.players[playerId] || { proposals: [] };
    const pact = (record.proposals || []).find((item) => item.id === pactId);
    if (!pact || pact.status !== 'pending') return;
    if (decision === 'accepted') {
      try {
        await OBR.broadcast.sendMessage(MAGIC_APPROVED_CHANNEL, {
          playerId, pact: { ...pact, status: 'accepted', reviewedAt: Date.now() }
        }, { destination: 'ALL' });
      } catch (error) {
        console.error('No se pudo entregar el conjuro aprobado al jugador', error);
        return;
      }
    }
    record.proposals = (record.proposals || []).filter((item) => item.id !== pactId);
    if (record.proposals.length) next.players[playerId] = record;
    else delete next.players[playerId];
    try { await OBR.room.setMetadata({ [MAGIC_KEY]: next }); magicData = next; }
    catch (error) { console.error('No se pudo retirar la propuesta revisada', error); }
  }

  function exportCharacter() {
    const data = JSON.stringify({ format: 'MIMPROV-character', version: 1, character }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (character.name || 'personaje-mimprov').trim().replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() + '.json';
    link.click();
    URL.revokeObjectURL(url);
  }
  async function importCharacter(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = parsed?.format === 'MIMPROV-character' ? parsed.character : parsed;
      if (!incoming || typeof incoming !== 'object' || !incoming.approaches || !Array.isArray(incoming.traits) || !Array.isArray(incoming.inventory)) {
        throw new Error('El archivo no contiene una ficha MIMPROV válida.');
      }
      character = { ...blankCharacter(), ...incoming, approaches: { ...blankCharacter().approaches, ...incoming.approaches }, created: true };
      updateCharacter();
      editingCharacter = false;
      step = 0;
    } catch (error) {
      console.error('No se pudo importar la ficha MIMPROV', error);
      alert('No se pudo importar el archivo. Selecciona una exportación JSON de MIMPROV.');
    } finally {
      input.value = '';
    }
  }
  $: selectedApproachScore = Number(character.approaches?.[selectedApproach] || 0);
  $: selectedTraitBonus = selectedTrait && character.traits.includes(selectedTrait) ? 1 : 0;
  $: selectedStatePenalty = selectedState && STATES.find(s => s.name === selectedState && (s.enfoque === selectedApproach || s.enfoque === 'Todos')) ? 1 : 0;
  $: baseDicePool = selectedApproachScore + selectedTraitBonus - selectedStatePenalty;
  $: dicePool = baseDicePool + (rollModifier === 'advantage' ? 1 : rollModifier === 'disadvantage' ? -1 : 0);
  $: forcedLowRoll = Number(character.will) <= 0;
  $: diceNotation = forcedLowRoll || dicePool <= 0 ? '2d6kl1' : `${dicePool}d6kh1`;

  async function checkDicePlusReady(): Promise<boolean> {
    const requestId = `mimprov_ready_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return new Promise((resolve) => {
      const unsubscribe = OBR.broadcast.onMessage('dice-plus/isReady', (event) => {
        const data = event.data as any;
        if (data?.ready === true && data.requestId === requestId) {
          unsubscribe();
          resolve(true);
        }
      });
      OBR.broadcast.sendMessage('dice-plus/isReady', { requestId, timestamp: Date.now() }, { destination: 'ALL' })
        .catch(() => { unsubscribe(); resolve(false); });
      setTimeout(() => { unsubscribe(); resolve(false); }, 1500);
    });
  }

  async function sendDiceRoll(notation: string, pool: number, approach: string, effortReroll = false) {
    if (!OBR.isAvailable || !loaded || pendingDiceRoll) return;
    dicePlusError = '';
    try {
      const rollId = `mimprov_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      pendingDiceRoll = {
        rollId, pool, notation, approach, effortReroll,
        conflictActive, danger: conflictDanger
      };
      lastRoll = { dice: [], kept: 0, pool, result: effortReroll ? 'Repitiendo todos los dados…' : 'Tirando en Dice+…', critical: false, notation };
      await OBR.broadcast.sendMessage('dice-plus/roll-request', {
        rollId,
        playerId: await OBR.player.getId(),
        playerName: await OBR.player.getName(),
        rollTarget: 'everyone',
        diceNotation: notation + ' # MIMPROV',
        showResults: true,
        timestamp: Date.now(),
        source: DICE_PLUS_SOURCE
      }, { destination: 'ALL' });
      setTimeout(() => {
        if (pendingDiceRoll?.rollId === rollId) {
          pendingDiceRoll = null;
          dicePlusError = 'Dice+ no respondió a la tirada. Comprueba que esté instalado y activo en esta sala.';
        }
      }, 12000);
    } catch (error) {
      console.error('No se pudo enviar la tirada a Dice+', error);
      pendingDiceRoll = null;
      const detail = error instanceof Error
        ? `${error.name}: ${error.message}`
        : (() => { try { return JSON.stringify(error); } catch { return String(error ?? 'Error desconocido'); } })();
      dicePlusError = `[MIMPROV 1.3.7] Error al enviar la solicitud a Dice+: ${detail || 'sin detalle'}.`;
    }
  }

  async function rollDice() {
    if (!OBR.isAvailable || !loaded) {
      dicePlusError = 'Esta tirada necesita Owlbear Rodeo y la extensión Dice+.';
      return;
    }
    if (pendingDiceRoll) return;
    await sendDiceRoll(diceNotation, baseDicePool, selectedApproach);
  }

  function stateForApproach(approach: string): string {
    const stateByApproach: Record<string, string> = {
      Tenacidad: 'Deprimido', Control: 'Ansioso', Astucia: 'Confundido', Rapidez: 'Mermado'
    };
    return stateByApproach[approach] || '';
  }

  async function spendEffortAndReroll(roll: { notation: string; pool: number; approach: string }) {
    if (visibleOverexertionUsed >= 1) return false;
    const state = stateForApproach(roll.approach);
    try {
      await OBR.broadcast.sendMessage(EFFORT_REQUEST_CHANNEL, {
        playerId: await OBR.player.getId(),
        approach: roll.approach,
        state,
        requestedAt: Date.now()
      }, { destination: 'ALL' });
      visibleOverexertionUsed = 1;
      if (state && !visibleStates.includes(state) && !visibleStates.includes('Incapacitado')) visibleStates = [...visibleStates, state];
      await sendDiceRoll(roll.notation, roll.pool, roll.approach, true);
      return true;
    } catch (error) {
      console.error('No se pudo solicitar el gasto del Punto de Esfuerzo', error);
      dicePlusError = 'No se pudo registrar el Punto de Esfuerzo con el narrador.';
      return false;
    }
  }

  function applyConflictFailure(active: boolean, danger: string) {
    if (!active) return;
    const willLoss: Record<string, number> = { Bajo: 1, Medio: 2, Alto: 3 };
    const loss = willLoss[danger] ?? 1;
    adjustWill(-loss);
  }

  function handleDicePlusResult(event: any) {
    const data = event.data as any;
    if (!pendingDiceRoll || data?.rollId !== pendingDiceRoll.rollId || !data.result) return;
    const roll = { ...pendingDiceRoll };
    const dice = (data.result.groups || []).flatMap((group: any) =>
      (group.dice || []).map((die: any) => Number(die.value)).filter((value: number) => Number.isFinite(value))
    );
    const keptDice = (data.result.groups || []).flatMap((group: any) =>
      (group.dice || []).filter((die: any) => die.kept !== false).map((die: any) => Number(die.value)).filter((value: number) => Number.isFinite(value))
    );
    const kept = keptDice.length ? (roll.notation.includes('kl1') ? Math.min(...keptDice) : Math.max(...keptDice)) : Number(data.result.totalValue);
    const critical = dice.filter((value: number) => value === 6).length >= 2;
    const failed = kept <= 4;
    const result = failed ? 'Fracaso' : kept === 5 ? 'Éxito con consecuencia' : 'Éxito limpio';
    lastRoll = {
      dice, kept, pool: roll.pool,
      result: critical ? 'Éxito crítico' : result,
      critical, notation: roll.notation, summary: data.result.rollSummary
    };
    pendingDiceRoll = null;
    if (critical) {
      adjustWill(1);
      return;
    }
    if (!failed) return;
    if (!roll.effortReroll && visibleOverexertionUsed < 1) {
      const useEffort = window.confirm('Has fallado la tirada. ¿Quieres gastar tu Punto de Esfuerzo para añadir el Estado correspondiente a este Enfoque y volver a lanzar todos los dados?');
      if (useEffort) {
        spendEffortAndReroll(roll);
        return;
      }
    }
    applyConflictFailure(roll.conflictActive, roll.danger);
  }

  function handleDicePlusError(event: any) {
    const data = event.data as any;
    if (!pendingDiceRoll || data?.rollId !== pendingDiceRoll.rollId) return;
    dicePlusError = `Dice+ no pudo realizar la tirada: ${data.error || 'error desconocido'}`;
    pendingDiceRoll = null;
  }

  onMount(() => {
    character = getStoredCharacter();
    if (OBR.isAvailable) {
      OBR.onReady(async () => {
        try {
          const role = await OBR.player.getRole();
          if (role === 'PLAYER') {
            const metadata = await OBR.player.getMetadata();
            if (metadata[DATA_KEY]) {
              character = { ...blankCharacter(), ...(metadata[DATA_KEY] as Character) };
              saveLocalCharacter();
            } else if (character.created) {
              await OBR.player.setMetadata({ [DATA_KEY]: clone(character) });
            }
          }
          if (role === 'PLAYER') {
            playerMagicRecord = (await OBR.player.getMetadata())?.[PLAYER_MAGIC_KEY] || { spells: [] };
            const syncStates = (metadata: any) => {
              const allStates = metadata?.[STATE_KEY] || {};
              visibleStates = Array.isArray(allStates[$currentPlayerId]) ? allStates[$currentPlayerId] : [];
              const allOverexertion = metadata?.[OVEREXERTION_KEY] || {};
              visibleOverexertionUsed = Math.max(0, Math.min(1, Number(allOverexertion[$currentPlayerId]) || 0));
              const conflict = metadata?.[CONFLICT_KEY] || {};
              conflictActive = conflict.active === true;
              conflictDanger = ['Bajo', 'Medio', 'Alto'].includes(conflict.danger) ? conflict.danger : 'Bajo';
            };
            syncStates(await OBR.room.getMetadata());
            OBR.room.onMetadataChange(syncStates);
          }
          OBR.broadcast.onMessage(EFFORT_REQUEST_CHANNEL, async (event) => {
            if (role !== 'GM') return;
            const data = event.data as any;
            if (!data?.playerId || !data?.approach || !data?.state) return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || sender.role !== 'PLAYER' || sender.id !== data.playerId) return;
              const tracker = playerTracker(sender.id);
              if (tracker.overexertionUsed >= 1) return;
              tracker.overexertionUsed = 1;
              if (!tracker.states.includes(data.state) && !tracker.states.includes('Incapacitado')) tracker.states = [...tracker.states, data.state];
              saveGmTracker();
            } catch (error) {
              console.error('No se pudo registrar el Punto de Esfuerzo', error);
            }
          });
          OBR.broadcast.onMessage(MAGIC_SUBMIT_CHANNEL, async (event) => {
            if (role !== 'GM') return;
            const data = event.data as any;
            if (!data?.playerId || !data?.pact?.id || !data.pact.effect?.trim() || !data.pact.price?.trim()) return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || sender.role !== 'PLAYER' || sender.id !== data.playerId) return;
              const current = (await OBR.room.getMetadata())?.[MAGIC_KEY] || { players: {} };
              const next = clone(current); if (!next.players) next.players = {};
              const record = next.players[sender.id] || { proposals: [], spells: [] };
              record.proposals = Array.isArray(record.proposals) ? record.proposals : [];
              if (record.proposals.some((item) => item.id === data.pact.id)) return;
              record.proposals = [...record.proposals, { id: String(data.pact.id), effect: String(data.pact.effect).trim(), price: String(data.pact.price).trim(), status: 'pending', createdAt: Number(data.pact.createdAt) || Date.now(), playerName: sender.name || data.playerName || 'Jugador' }];
              next.players[sender.id] = record; await OBR.room.setMetadata({ [MAGIC_KEY]: next }); magicData = next;
            } catch (error) { console.error('No se pudo registrar la propuesta de pacto', error); }
          });
          OBR.broadcast.onMessage(MAGIC_APPROVED_CHANNEL, async (event) => {
            const data = event.data as any;
            if (role !== 'PLAYER' || data?.playerId !== $currentPlayerId || !data?.pact?.id) return;
            const spells = Array.isArray(playerMagicRecord?.spells) ? [...playerMagicRecord.spells] : [];
            if (!spells.some((item) => item.id === data.pact.id)) spells.push(data.pact);
            playerMagicRecord = { spells };
            try { await OBR.player.setMetadata({ [PLAYER_MAGIC_KEY]: playerMagicRecord }); }
            catch (error) { console.error('No se pudo guardar el conjuro en la ficha del jugador', error); }
          });
          OBR.room.onMetadataChange((metadata) => { magicData = metadata?.[MAGIC_KEY] || { players: {} }; });
          OBR.room.getMetadata().then((metadata) => { magicData = metadata?.[MAGIC_KEY] || { players: {} }; }).catch((error) => console.error('No se pudieron cargar los pactos mágicos', error));
          OBR.broadcast.onMessage(REST_REQUEST_CHANNEL, async (event) => {
            if (role !== 'GM') return;
            const data = event.data as any;
            if (!data?.playerId) return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || sender.role !== 'PLAYER' || sender.id !== data.playerId) return;
              playerTracker(sender.id).overexertionUsed = 0;
              saveGmTracker();
            } catch (error) {
              console.error('No se pudo registrar el descanso', error);
            }
          });
          OBR.broadcast.onMessage(DELETE_CHARACTER_CHANNEL, async (event) => {
            const data = event.data as any;
            if (!data) return;
            if (role === 'GM' && data.action === 'PLAYER_DELETE_REQUEST' && data.playerId) {
              try {
                const party = await OBR.party.getPlayers();
                const sender = party.find((p: any) => p.connectionId === event.connectionId);
                if (sender && sender.role === 'PLAYER' && sender.id === data.playerId) {
                  await deletePlayerCharacter(sender, true);
                }
              } catch (error) {
                console.error('No se pudo procesar la solicitud de eliminación', error);
              }
              return;
            }
            if (data.action !== 'DELETE_CHARACTER' || data.playerId !== $currentPlayerId) return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || sender.role !== 'GM') return;
              character = blankCharacter();
              editingCharacter = false;
              step = 0;
              localStorage.removeItem('mimprov-character-v1');
              await OBR.player.setMetadata({ [DATA_KEY]: clone(character), [PLAYER_MAGIC_KEY]: { spells: [] } });
              playerMagicRecord = { spells: [] };
              magicData = { ...magicData, players: { ...(magicData.players || {}) } };
              delete magicData.players[$currentPlayerId];
            } catch (error) {
              console.error('No se pudo borrar la ficha del personaje', error);
            }
          });
                    OBR.broadcast.onMessage(`${DICE_PLUS_SOURCE}/roll-result`, handleDicePlusResult);
          OBR.broadcast.onMessage(`${DICE_PLUS_SOURCE}/roll-error`, handleDicePlusError);
          loaded = true;
        } catch (error) {
          console.error('Error al cargar la ficha MIMPROV', error);
          loaded = true;
        }
      });
    } else {
      loaded = true;
    }
    if (OBR.isAvailable) {
      OBR.onReady(() => { loadGmTracker(); gmLoaded = true; });
    } else {
      loadGmTracker(); gmLoaded = true;
    }
  });

  function loadGmTracker() {
    try {
      const room = OBR.isAvailable ? OBR.room.id : 'local';
      const raw = localStorage.getItem('mimprov-gm-v1-' + room);
      gmTracker = raw ? JSON.parse(raw) : { players: {}, conflict: { danger: 'Bajo', resistance: null } };
      if (!gmTracker || typeof gmTracker !== 'object') gmTracker = { players: {}, conflict: { danger: 'Bajo', resistance: null } };
      if (!gmTracker.players || typeof gmTracker.players !== 'object') gmTracker.players = {};
      if (!gmTracker.conflict || typeof gmTracker.conflict !== 'object') gmTracker.conflict = { active: false, danger: 'Bajo', resistance: null };
      if (typeof gmTracker.conflict.active !== 'boolean') gmTracker.conflict.active = false;
      if (!['Bajo', 'Medio', 'Alto'].includes(gmTracker.conflict.danger)) gmTracker.conflict.danger = 'Bajo';
      if (gmTracker.conflict.resistance !== null && !Number.isFinite(Number(gmTracker.conflict.resistance))) gmTracker.conflict.resistance = null;
    } catch { gmTracker = { players: {}, conflict: { active: false, danger: 'Bajo', resistance: null } }; }
    conflictActive = gmTracker.conflict.active === true;
    conflictDanger = gmTracker.conflict.danger || 'Bajo';
    saveGmTracker();
  }
  function saveGmTracker() {
    const room = OBR.isAvailable ? OBR.room.id : 'local';
    localStorage.setItem('mimprov-gm-v1-' + room, JSON.stringify(gmTracker));
    gmTracker = clone(gmTracker);
    if (OBR.isAvailable && $isGM) {
      const allStates: Record<string, string[]> = {};
      const allOverexertion: Record<string, number> = {};
      Object.entries(gmTracker.players || {}).forEach(([id, tracker]: [string, any]) => {
        allStates[id] = Array.isArray(tracker.states) ? [...tracker.states] : [];
        allOverexertion[id] = Math.max(0, Math.min(1, Number(tracker.overexertionUsed) || 0));
      });
      OBR.room.setMetadata({ [STATE_KEY]: allStates, [OVEREXERTION_KEY]: allOverexertion, [CONFLICT_KEY]: clone(gmTracker.conflict) }).catch((error) => {
        console.error('No se pudieron publicar los datos de seguimiento de los personajes', error);
      });
    }
  }
  function playerTracker(id: string) {
    if (!gmTracker.players[id]) gmTracker.players[id] = { states: [], risk: 'Ninguno', overexertionUsed: 0, overexertionNotes: [] };
    gmTracker.players[id].overexertionUsed = Math.max(0, Math.min(1, Number(gmTracker.players[id].overexertionUsed) || 0));
    return gmTracker.players[id];
  }
  function getPlayerCharacter(player: any): Character | undefined {
    return player?.metadata?.[DATA_KEY] as Character | undefined;
  }

  function startCreation() { step = 0; character = blankCharacter(); approachDraft = { Tenacidad: 0, Control: 0, Astucia: 0, Rapidez: 0 }; }
  function nextStep() {
    if (step === 1 && !character.concept.trim()) return;
    if (step === 4 && !approachValid) return;
    if (step === 5 && character.traits.length !== 4) return;
    if (step === 6 && character.inventory.length < 12) return;
    if (step === 4) character.approaches = { ...approachDraft };
    if (step < 7) step += 1;
    else { character.created = true; character.will = 4; character.maxWill = 4; updateCharacter(); editingCharacter = false; }
  }
  function previousStep() { if (step > 0) step -= 1; }
  function setApproach(name: string, value: number) {
    approachDraft = { ...approachDraft, [name]: Math.max(0, Math.min(2, value)) };
  }
  function addTrait() {
    const trait = traitDraft === 'Conocedor de...' && customTraitField.trim() ? 'Conocedor de ' + customTraitField.trim() : traitDraft;
    if (!trait || character.traits.length >= 4 || character.traits.includes(trait)) return;
    character.traits = [...character.traits, trait];
    const equipment = EQUIPMENT[trait] || (trait.startsWith('Conocedor de ') ? EQUIPMENT['Conocedor de...'] : ['', '', '']);
    equipment.forEach((name, i) => character.inventory.push({ id: Date.now() + i + character.inventory.length, name, trait }));
    traitDraft = ''; customTraitField = ''; updateCharacter();
  }
  function removeTrait(trait: string) {
    character.traits = character.traits.filter(t => t !== trait);
    character.inventory = character.inventory.filter(i => i.trait !== trait);
    updateCharacter();
  }
  function addInventoryItem() {
    character.inventory = [...character.inventory, { id: Date.now(), name: '', trait: 'Personal' }];
    updateCharacter();
  }
  function removeInventoryItem(id: number) {
    character.inventory = character.inventory.filter(i => i.id !== id);
    updateCharacter();
  }
  function finishEdit() { updateCharacter(); editingCharacter = false; }
  function adjustWill(delta: number) { character.will = Math.max(0, Math.min(character.maxWill, character.will + delta)); updateCharacter(); }
  async function restCharacter() {
    try {
      if (OBR.isAvailable) {
        await OBR.broadcast.sendMessage(REST_REQUEST_CHANNEL, {
          playerId: await OBR.player.getId(),
          requestedAt: Date.now()
        }, { destination: 'ALL' });
      } else {
        visibleOverexertionUsed = 0;
      }
      adjustWill(2);
      if (!OBR.isAvailable) {
        const tracker = playerTracker('local');
        tracker.overexertionUsed = 0;
        saveGmTracker();
      }
    } catch (error) {
      console.error('No se pudo realizar el descanso', error);
      dicePlusError = 'No se pudo registrar el descanso. Inténtalo de nuevo.';
    }
  }
  function toggleState(id: string, stateName: string) {
    const t = playerTracker(id);
    if (t.states.includes(stateName)) t.states = t.states.filter((s: string) => s !== stateName);
    else if (stateName === 'Incapacitado') t.states = ['Incapacitado'];
    else if (!t.states.includes('Incapacitado')) t.states = [...t.states.filter((s: string) => s !== 'Incapacitado'), stateName];
    saveGmTracker();
  }
  function setOverexertion(id: string, value: number) {
    playerTracker(id).overexertionUsed = Math.max(0, Math.min(2, value));
    saveGmTracker();
  }
  function spendOverexertion(id: string, enfoque: string) {
    const t = playerTracker(id);
    if (t.overexertionUsed >= 1) return;
    const stateByApproach: Record<string, string> = { Tenacidad: 'Deprimido', Control: 'Ansioso', Astucia: 'Confundido', Rapidez: 'Mermado' };
    const state = stateByApproach[enfoque];
    t.overexertionUsed += 1;
    if (!t.states.includes(state) && !t.states.includes('Incapacitado')) t.states = [...t.states, state];
    saveGmTracker();
  }
  async function deletePlayerCharacter(player: any, alreadyConfirmed = false) {
    const stored = getPlayerCharacter(player);
    if (!stored?.created) return;
    const name = stored.name || player.name;
    if (!alreadyConfirmed && !confirm(`¿Borrar la ficha de ${name}? El personaje volverá al estado de creación y el jugador tendrá que crearlo nuevamente.`)) return;
    try {
      await OBR.broadcast.sendMessage(DELETE_CHARACTER_CHANNEL, {
        action: 'DELETE_CHARACTER',
        playerId: player.id,
        requestedAt: Date.now()
      }, { destination: 'ALL' });
      const tracker = playerTracker(player.id);
      tracker.states = [];
      tracker.overexertionUsed = 0;
      tracker.overexertionNotes = [];
      const currentMagic = clone(magicData || { players: {} });
      if (currentMagic.players) delete currentMagic.players[player.id];
      await OBR.room.setMetadata({ [MAGIC_KEY]: currentMagic });
      magicData = currentMagic;
      saveGmTracker();
    } catch (error) {
      console.error('No se pudo solicitar el borrado de la ficha', error);
      alert('No se pudo completar el borrado de la ficha. Comprueba la conexión con Owlbear Rodeo.');
    }
  }

  async function requestOwnCharacterDeletion() {
    if (!character.created) return;
    if (!confirm(`¿Eliminar tu personaje ${character.name || ''}? Se borrarán también tus propuestas y conjuros.`)) return;
    if (!OBR.isAvailable || !$currentPlayerId) {
      character = blankCharacter();
      localStorage.removeItem('mimprov-character-v1');
      editingCharacter = false;
      step = 0;
      return;
    }
    try {
      await OBR.broadcast.sendMessage(DELETE_CHARACTER_CHANNEL, {
        action: 'PLAYER_DELETE_REQUEST',
        playerId: $currentPlayerId,
        requestedAt: Date.now()
      }, { destination: 'ALL' });
    } catch (error) {
      console.error('No se pudo solicitar la eliminación del personaje', error);
      alert('No se pudo enviar la solicitud. Comprueba tu conexión con Owlbear Rodeo.');
    }
  }

  function resolveConflict(outcome: 'decisive' | 'resistance' | 'defeat') {
    const conflict = gmTracker.conflict || { active: true, danger: 'Bajo', resistance: null };
    const resistance = Math.max(0, Number(conflict.resistance ?? initialConflictResistance) || 0);
    if (outcome === 'decisive' || resistance <= 0) {
      conflict.result = 'Victoria decisiva: la Resistencia llegó a 0.';
    } else {
      const remainingWill = partyMembers.reduce((total, player) => {
        const will = Number(getPlayerCharacter(player)?.will) || 0;
        return total + Math.max(0, will);
      }, 0);
      if (remainingWill >= resistance) {
        conflict.result = `Victoria por resistencia: ${remainingWill} de Voluntad frente a ${resistance} de Resistencia.`;
      } else {
        conflict.result = `Derrota: ${remainingWill} de Voluntad frente a ${resistance} de Resistencia. Todos reciben Incapacitado.`;
        partyMembers.forEach((player) => {
          const tracker = playerTracker(player.id);
          tracker.states = ['Incapacitado'];
        });
      }
    }
    conflict.active = false;
    gmTracker.conflict = conflict;
    saveGmTracker();
  }

  function setConflictActive(active: boolean) {
    if (!gmTracker.conflict) gmTracker.conflict = { active: false, danger: 'Bajo', resistance: null };
    if (active) {
      gmTracker.conflict.active = true;
      gmTracker.conflict.result = '';
      saveGmTracker();
      return;
    }
    if (gmTracker.conflict.active) resolveConflict('resistance');
    else {
      gmTracker.conflict.active = false;
      saveGmTracker();
    }
  }
  function adjustConflictResistance(delta: number) {
    if (!gmTracker.conflict) gmTracker.conflict = { danger: 'Bajo', resistance: null };
    const current = gmTracker.conflict.resistance ?? initialConflictResistance;
    gmTracker.conflict.resistance = Math.max(0, current + delta);
    if (gmTracker.conflict.active && gmTracker.conflict.resistance === 0) resolveConflict('decisive');
    else saveGmTracker();
  }
  function resetConflictResistance() {
    if (!gmTracker.conflict) gmTracker.conflict = { danger: 'Bajo', resistance: null };
    gmTracker.conflict.resistance = null;
    saveGmTracker();
  }
  function setConflictDanger(danger: string) {
    if (!gmTracker.conflict) gmTracker.conflict = { active: false, danger: 'Bajo', resistance: null };
    gmTracker.conflict.danger = danger;
    saveGmTracker();
  }
</script>

<svelte:head>
  <title>DummySheet MIMPROV</title>
</svelte:head>

<div class="app-shell">
  {#if !$isGM}
    <nav class="main-tabs">
      <button class:active={activeTab === 'personaje'} on:click={() => { activeTab = 'personaje'; }}>Personaje</button>
      <button class:active={activeTab === 'tiradas'} on:click={() => { activeTab = 'tiradas'; }}>Tiradas</button>
      <button class:active={activeTab === 'reglamento'} on:click={() => { activeTab = 'reglamento'; }}>Reglamento</button>
      <button class:active={activeTab === 'magia'} on:click={() => { activeTab = 'magia'; }}>Magia</button>
      <button class:active={activeTab === 'notas'} on:click={() => { activeTab = 'notas'; }}>Notas</button>
    </nav>
  {:else}
    <nav class="main-tabs">
      <button class:active={activeTab === 'gm'} on:click={() => { activeTab = 'gm'; }}>Personajes</button>
      <button class:active={activeTab === 'conflicto'} on:click={() => { activeTab = 'conflicto'; }}>Conflicto</button>
      <button class:active={activeTab === 'reglamento'} on:click={() => { activeTab = 'reglamento'; }}>Reglamento</button>
      <button class:active={activeTab === 'magia-gm'} on:click={() => { activeTab = 'magia-gm'; }}>Magia</button>
    </nav>
  {/if}

  {#if !$isGM && activeTab === 'personaje'}
    <main class="content">
      {#if !character.created}
        <section class="card wizard">
          <div class="eyebrow">CREACIÓN DE PERSONAJE · PASO {step + 1} DE 8</div>
          <div class="progress"><span style="width:{(step + 1) * 12.5}%"></span></div>
          {#if step === 0}
            <h1>¿Cómo se llama tu personaje?</h1>
            <label>Nombre<input bind:value={character.name} list="mimprov-name-options" placeholder="Nombre del personaje"></label>
            <datalist id="mimprov-name-options">
              {#each nameOptions as option}<option value={option}></option>{/each}
            </datalist>
            <div class="name-generator">
              <label>Ambientación<select bind:value={nameStyle}>
                <option value="fantasy">Fantasía</option><option value="contemporary">Contemporánea</option><option value="futuristic">Futurista</option>
              </select></label>
              <label>Tipo de nombre<select bind:value={nameGender}>
                <option value="masculine">Hombre</option><option value="feminine">Mujer</option><option value="unisex">Unisex</option>
              </select></label>
              <button type="button" class="name-dice" on:click={generateRandomName} aria-label="Generar nombre aleatorio">🎲 Generar nombre</button>
            </div>
            <small class="muted">Puedes escribir un nombre, elegir una sugerencia al escribir o generar uno al azar con el dado.</small>
          {:else if step === 1}
            <h1>¿Cuál es su concepto?</h1>
            <p>Escribe una frase que describa quién es y qué lo caracteriza.</p>
            <label>Concepto<textarea bind:value={character.concept} rows="3" placeholder="Una exploradora que busca rutas seguras entre ciudades aisladas..."></textarea></label>
            <label>Sugerencias de concepto<select on:change={(event) => { if (event.currentTarget.value) character.concept = event.currentTarget.value; }}>
              <option value="">Elegir una sugerencia...</option>
              {#each conceptOptions as option}<option value={option}>{option}</option>{/each}
            </select></label>
            <div class="name-generator concept-generator">
              <label>Género narrativo<select bind:value={conceptGenre}>
                <option value="fantasy">Fantasía</option><option value="scifi">Ciencia ficción</option><option value="horror">Terror</option><option value="modern">Contemporáneo / urbano</option><option value="postapocalyptic">Postapocalíptico</option>
              </select></label>
              <button type="button" class="name-dice" on:click={generateRandomConcept} aria-label="Generar concepto aleatorio">🎲 Generar concepto</button>
            </div>
            <small class="muted">Elige un género para ver sugerencias o genera una frase aleatoria. Puedes editarla libremente.</small>
          {:else if step === 2}
            <h1>¿Qué edad tiene?</h1>
            <label>Edad<input bind:value={character.age} placeholder="Edad o rango aproximado"></label>
          {:else if step === 3}
            <h1>¿Cómo es su apariencia?</h1>
            <p>Elige un rango de edad y si el personaje es hombre o mujer para recibir descripciones físicas generales que puedas usar o modificar.</p>
            <div class="name-generator">
              <label>Rango de edad<select bind:value={appearanceAge} on:change={syncAppearanceAge}>
                {#each APPEARANCE_AGES as age}<option value={age.value}>{age.label}</option>{/each}
              </select></label>
              <label>Género<select bind:value={appearanceGender}>
                <option value="male">Hombre</option><option value="female">Mujer</option>
              </select></label>
              <button type="button" class="name-dice" on:click={generateRandomAppearance}>🎲 Generar apariencia</button>
            </div>
            <label>Sugerencias de apariencia<select on:change={(event) => { if (event.currentTarget.value) character.appearance = event.currentTarget.value; }}>
              <option value="">Elegir una descripción...</option>
              {#each appearanceOptions as option}<option value={option}>{option}</option>{/each}
            </select></label>
            <label>Apariencia<textarea bind:value={character.appearance} rows="3" placeholder="Descripción física y vestimenta"></textarea></label>
            <small class="muted">Puedes elegir una sugerencia, generar una al azar o escribir tu propia descripción. Todas son editables.</small>
          {:else if step === 4}
            <h1>Distribuye sus Enfoques</h1>
            <p>Reparte exactamente 4 puntos. Cada Enfoque puede tener entre 0 y 2 puntos.</p>
            {#each APPROACHES as name}
              <div class="approach-row"><div><strong>{name}</strong><small>{APPROACH_DESCRIPTIONS[name].long}</small></div><div class="stepper"><button on:click={() => setApproach(name, approachDraft[name] - 1)} disabled={approachDraft[name] <= 0}>−</button><b>{approachDraft[name]}</b><button on:click={() => setApproach(name, approachDraft[name] + 1)} disabled={approachDraft[name] >= 2 || approachTotal >= 4}>+</button></div></div>
            {/each}
            <div class:valid={approachValid} class="total-points">Puntos distribuidos: {approachTotal} / 4</div>
          {:else if step === 5}
            <h1>Escoge cuatro Rasgos</h1>
            <p>Cada Rasgo aporta un dado cuando es directamente relevante para una acción.</p>
            <div class="trait-picker">
              <select bind:value={traitDraft}><option value="">Seleccionar Rasgo...</option>{#each TRAITS as trait}<option value={trait} disabled={character.traits.includes(trait) || character.traits.length >= 4}>{trait}</option>{/each}</select>
              {#if traitDraft === 'Conocedor de...'}<input bind:value={customTraitField} placeholder="¿Conocedor de qué?">{/if}
              <button on:click={addTrait} disabled={!traitDraft || (traitDraft === 'Conocedor de...' && !customTraitField.trim())}>Añadir</button>
            </div>
            <div class="selected-list">{#each character.traits as trait}<div class="selected-item trait-description"><div><strong>{trait}</strong><small>{trait.startsWith('Conocedor de ') ? 'Conocedor de...': trait} </small><p>{trait.startsWith('Conocedor de ') ? 'Posees conocimientos y experiencia en ' + trait.slice('Conocedor de '.length) + '. Puedes reconocer elementos propios de esa materia, comprender información especializada, recordar procedimientos y resolver problemas relacionados con ese ámbito.' : TRAIT_DESCRIPTIONS[trait]?.long || ''}</p></div><button class="remove" on:click={() => removeTrait(trait)}>Quitar</button></div>{/each}</div>
            <div class="total-points" class:valid={character.traits.length === 4}>Rasgos seleccionados: {character.traits.length} / 4</div>
          {:else if step === 6}
            <h1>Prepara su equipo</h1>
            <p>Cada Rasgo entrega tres objetos asociados. Puedes editar los nombres de los objetos y añadir pertenencias personales.</p>
            {#each character.traits as trait}
              <div class="equipment-group"><h3>{trait}</h3>{#each character.inventory.filter(i => i.trait === trait) as item}
                <label class="inline-label"><input value={item.name} placeholder="Nombre del objeto" on:input={(e) => { item.name = e.currentTarget.value; updateCharacter(); }}></label>
              {/each}</div>
            {/each}
            <button class="secondary" on:click={addInventoryItem}>Añadir objeto personal</button>
            {#each character.inventory.filter(i => i.trait === 'Personal') as item}
              <div class="inventory-row"><input bind:value={item.name} placeholder="Objeto personal"><button class="remove" on:click={() => removeInventoryItem(item.id)}>×</button></div>
            {/each}
            <div class="total-points" class:valid={character.inventory.length >= 12}>Objetos de Rasgos: 12 · Total actual: {character.inventory.length}</div>
          {:else}
            <h1>Revisa el personaje</h1>
            <div class="summary"><p><strong>{character.name || 'Sin nombre'}</strong></p><p>{character.concept}</p><h3>Enfoques</h3>{#each APPROACHES as name}<p>{name}: {approachDraft[name]}</p>{/each}<h3>Rasgos</h3><p>{character.traits.join(' · ')}</p><h3>Equipo</h3><p>{character.inventory.map(i => i.name || 'Objeto por definir').join(' · ')}</p><p>Voluntad inicial: 4 / 4</p><p>Sobreesfuerzo disponible: 1</p></div>
          {/if}
          <div class="wizard-actions">
            {#if step > 0}<button class="secondary" on:click={previousStep}>Anterior</button>{/if}
            <button on:click={nextStep} disabled={(step === 1 && !character.concept.trim()) || (step === 4 && !approachValid) || (step === 5 && character.traits.length !== 4) || (step === 6 && character.inventory.length < 12)}>{step === 7 ? 'Crear personaje' : 'Continuar'}</button>
          </div>
        </section>
      {:else}
        <section class="character-sheet">
          <header class="sheet-header"><div><div class="eyebrow">PERSONAJE MIMPROV</div><h1>{character.name || 'Sin nombre'}</h1><p>{character.concept}</p></div><div class="sheet-header-actions"><button class="secondary" on:click={() => editingCharacter = !editingCharacter}>{editingCharacter ? 'Cerrar edición' : 'Editar ficha'}</button><button class="danger-button" on:click={requestOwnCharacterDeletion}>Eliminar personaje</button></div></header>
          <section class="card extra-info"><h2>Datos del personaje</h2><p><strong>Edad:</strong> {character.age || '—'}</p><p><strong>Apariencia:</strong> {character.appearance || '—'}</p><p><strong>Experiencia:</strong> {character.experience || '—'}</p></section>
          {#if editingCharacter}
            <div class="card edit-card">
              <label>Nombre<input bind:value={character.name} on:input={updateCharacter}></label>
              <label>Concepto<textarea bind:value={character.concept} on:input={updateCharacter}></textarea></label>
              <label>Edad<input bind:value={character.age} on:input={updateCharacter}></label>
              <label>Apariencia<textarea bind:value={character.appearance} on:input={updateCharacter}></textarea></label>
              <label>Experiencia<input bind:value={character.experience} on:input={updateCharacter}></label>
              <h3>Enfoques</h3>{#each APPROACHES as name}<div class="approach-row"><strong>{name}</strong><div class="stepper"><button on:click={() => { character.approaches[name] = Math.max(0, character.approaches[name] - 1); updateCharacter(); }}>−</button><b>{character.approaches[name]}</b><button on:click={() => { character.approaches[name] += 1; updateCharacter(); }}>+</button></div></div>{/each}
              <h3>Rasgos</h3>{#each character.traits as trait}<div class="selected-item"><span>{trait}</span><button class="remove" on:click={() => removeTrait(trait)}>Quitar</button></div>{/each}<div class="trait-picker"><select bind:value={traitDraft}><option value="">Añadir Rasgo...</option>{#each TRAITS as trait}<option value={trait}>{trait}</option>{/each}</select>{#if traitDraft === 'Conocedor de...'}<input bind:value={customTraitField} placeholder="¿Conocedor de qué?">{/if}<button on:click={addTrait} disabled={!traitDraft || (traitDraft === 'Conocedor de...' && !customTraitField.trim())}>Añadir</button></div>
              <button on:click={finishEdit}>Guardar cambios</button>
            </div>
          {/if}
          <section class="card export-tools">
            <h2>Exportar e importar ficha</h2>
            <p class="muted">Guarda una copia de tu personaje en un archivo JSON o carga una copia exportada anteriormente.</p>
            <div class="export-actions">
              <button on:click={exportCharacter}>Exportar personaje</button>
              <label class="import-button">Importar personaje<input type="file" accept="application/json,.json" on:change={importCharacter}></label>
            </div>
          </section>
          <div class="sheet-grid">
            <section class="card"><h2>Enfoques</h2>{#each APPROACHES as name}<div class="approach-row compact"><div><strong>{name}</strong><small>{APPROACH_DESCRIPTIONS[name].short}</small></div><span class="score">{character.approaches[name]}</span></div>{/each}</section>
            <section class="card"><h2>Rasgos</h2>{#each character.traits as trait}<div class="trait-line"><strong>{trait}</strong><small>{trait.startsWith('Conocedor de ') ? 'Conocedor de...' : trait} </small><p>{trait.startsWith('Conocedor de ') ? 'Conocimientos y experiencia en ' + trait.slice('Conocedor de '.length) + '.' : TRAIT_DESCRIPTIONS[trait]?.short || ''}</p></div>{/each}</section>
            <section class="card"><h2>Voluntad</h2><div class="will-value">{character.will}<small> / {character.maxWill}</small></div><div class="will-controls"><button on:click={() => adjustWill(-1)} disabled={character.will <= 0}>−</button><button on:click={() => adjustWill(1)} disabled={character.will >= character.maxWill}>+</button></div><button class="secondary full" on:click={restCharacter}>Descansar</button><p class="muted">Recuperas 2 puntos de Voluntad (sin superar el máximo) y tu Punto de Esfuerzo. Con 0 Voluntad, siempre tiras 2d6 y conservas el menor, sin importar ventaja o desventaja.</p></section>
            <section class="card extra-info"><h2>Punto de Esfuerzo</h2><div class="will-value">{1 - visibleOverexertionUsed}<small> / 1 punto disponible</small></div><p class="muted">Punto utilizado: {visibleOverexertionUsed}. Se recupera al realizar un descanso.</p></section>
            <section class="card"><h2>Estados</h2><div class="state-grid">{#each STATES as state}<label class="check-row"><input type="checkbox" checked={visibleStates.includes(state.name)} disabled><span><b>{state.name}</b><small>{state.enfoque}: {state.detail}</small></span></label>{/each}</div></section>
            <section class="card"><h2>Equipo</h2>{#each character.inventory as item}<div class="inventory-line"><input bind:value={item.name} placeholder="Objeto por definir" on:input={updateCharacter}><small>{item.trait}</small><button class="remove" on:click={() => removeInventoryItem(item.id)}>×</button></div>{/each}<button class="secondary full" on:click={addInventoryItem}>Añadir objeto</button></section>
          </div>
          <p class="sync-note">{OBR.isAvailable ? 'La ficha se sincroniza con Owlbear Rodeo.' : 'Modo de vista previa: la ficha se guarda en este navegador.'}</p>
        </section>
      {/if}
    </main>
  {:else if !$isGM && activeTab === 'tiradas'}
    <main class="content">
      <div class="eyebrow">CONSTRUCTOR DE POOL</div>
      <h1>Tiradas</h1>
      {#if !character.created}
        <section class="card"><p>Primero debes crear tu personaje para construir una reserva de dados.</p></section>
      {:else}
        <section class="card pool-builder">
          <h2>Construye tu pool</h2>
          <label>Enfoque
            <select bind:value={selectedApproach}>
              {#each APPROACHES as approach}
                <option value={approach}>{approach} · {character.approaches[approach] || 0}d6</option>
              {/each}
            </select>
          </label>
          <label>Rasgo
            <select bind:value={selectedTrait}>
              <option value="">Sin Rasgo</option>
              {#each character.traits as trait}
                <option value={trait}>{trait}</option>
              {/each}
            </select>
          </label>
          <label>Estado que afecta esta tirada
            <select bind:value={selectedState}>
              <option value="">Ninguno</option>
              {#each STATES as state}
                <option value={state.name}>{state.name} · {state.enfoque}</option>
              {/each}
            </select>
          </label>
          <div class="modifier-picker">
            <span>Modificador</span>
            <div class="modifier-options">
              <button class:active={rollModifier === 'normal'} class="secondary" on:click={() => rollModifier = 'normal'}>Normal</button>
              <button class:active={rollModifier === 'advantage'} class="secondary" on:click={() => rollModifier = 'advantage'}>Ventaja (+1d6)</button>
              <button class:active={rollModifier === 'disadvantage'} class="secondary" on:click={() => rollModifier = 'disadvantage'}>Desventaja (−1d6)</button>
            </div>
          </div>
          <div class="pool-summary">
            <div><small>Notación enviada a Dice+</small><strong>{diceNotation}</strong></div>
            <ul>
              <li>{selectedApproach}: +{selectedApproachScore}d6</li>
              <li>{selectedTrait ? selectedTrait + ': +1d6' : 'Sin Rasgo: +0d6'}</li>
              <li>{selectedStatePenalty ? selectedState + ': −1d6' : 'Estado: sin penalización'}</li>
              <li>{forcedLowRoll ? 'Voluntad 0: siempre tira 2d6 y conserva el menor; se ignoran ventaja y desventaja' : rollModifier === 'advantage' ? 'Ventaja: añade 1d6 y conserva el mayor' : rollModifier === 'disadvantage' ? (dicePool <= 0 ? 'Desventaja: reduce 1d6; al quedar en 0 dados, tira 2d6 y conserva el menor' : 'Desventaja: resta 1d6 y conserva el mayor') : 'Tirada normal: conserva el mayor'}</li>
            </ul>
          </div>
          {#if dicePlusError}<p class="error-message">{dicePlusError}</p>{/if}
          <button class="roll-button" disabled={!!pendingDiceRoll} on:click={rollDice}>{pendingDiceRoll ? 'Tirando…' : 'Tirar dados con Dice+'}</button>
        </section>
        {#if lastRoll}
          <section class="card roll-result">
            <h2>Resultado</h2>
            <p class="muted">{lastRoll.notation || ''} {lastRoll.summary ? '· ' + lastRoll.summary : ''}</p>
            <div class="dice-results">{#each lastRoll.dice as die, i}<span class:kept={die === lastRoll.kept && (lastRoll.notation?.includes("kl1") ? die === Math.min(...lastRoll.dice) : die === Math.max(...lastRoll.dice))} class="die">{die}</span>{/each}</div>
            <div class="kept-result">Dado conservado: <strong>{lastRoll.kept}</strong></div>
            <h3>{lastRoll.result}</h3>
            {#if lastRoll.critical}<p>Crítico: recuperas 1 punto de Voluntad.</p>{/if}
          </section>
        {/if}
      {/if}
    </main>
  {:else if $isGM && (activeTab === 'gm' || activeTab === 'conflicto')}
    <main class="content gm-content">
      {#if activeTab === 'gm'}
      <div class="eyebrow">HERRAMIENTAS DEL NARRADOR</div><h1>Personajes</h1>
      <p class="muted">Seguimiento independiente. Estos controles no modifican las fichas de los jugadores.</p>
      <section class="card"><h2>Personajes de la sala</h2>
        {#if partyMembers.length === 0}
          <p>No hay personajes creados en la sala.</p>
        {:else}
          <nav class="character-tabs" aria-label="Personajes">
            {#each partyMembers as player}
              <button class:active={selectedPlayerId === player.id} on:click={() => selectedPlayerId = player.id}>{getPlayerCharacter(player)?.name || player.name}</button>
            {/each}
          </nav>
          {#each partyMembers.filter(p => p.id === selectedPlayerId) as player}
            <article class="gm-player">
              <div class="gm-player-head"><div><h3>{getPlayerCharacter(player)?.name || player.name}</h3><small>{getPlayerCharacter(player)?.created ? getPlayerCharacter(player)?.concept : 'Ficha MIMPROV aún no creada'}</small></div>{#if getPlayerCharacter(player)?.created}<button class="danger-button" on:click={() => deletePlayerCharacter(player)}>Borrar personaje</button>{/if}</div>
              {#if getPlayerCharacter(player)?.created}
                <div class="gm-stats"><span>Voluntad: <b>{getPlayerCharacter(player)?.will} / {getPlayerCharacter(player)?.maxWill}</b></span><span>Enfoques: <b>{APPROACHES.map(a => a + ' ' + (getPlayerCharacter(player)?.approaches?.[a] ?? 0)).join(' · ')}</b></span><span>Rasgos: <b>{getPlayerCharacter(player)?.traits?.join(', ')}</b></span></div>
              {:else}<p class="muted">El jugador todavía no ha creado su ficha.</p>{/if}
              <h4>Estados actuales</h4><div class="state-grid">{#each STATES as state}<label class="check-row"><input type="checkbox" checked={playerTracker(player.id).states.includes(state.name)} on:change={() => toggleState(player.id, state.name)}><span><b>{state.name}</b><small>{state.enfoque}: {state.detail}</small></span></label>{/each}</div>
              <h4>Sobreesfuerzo</h4><p class="muted">Puntos disponibles: {1 - playerTracker(player.id).overexertionUsed} / 1</p><div class="stepper"><b>{playerTracker(player.id).overexertionUsed} usado</b></div><div class="approach-buttons">{#each APPROACHES as enfoque}<button class="secondary" on:click={() => spendOverexertion(player.id, enfoque)} disabled={playerTracker(player.id).overexertionUsed >= 1}>{enfoque}</button>{/each}</div><small class="muted">Al gastar el punto, el panel añade el Estado correspondiente al Enfoque utilizado. Se recupera al realizar un descanso.</small>
            </article>
          {/each}
        {/if}
      </section>
      <p class="sync-note">El seguimiento de personajes se guarda localmente en este dispositivo y sala.</p>
      {:else}
      <div class="eyebrow">SEGUIMIENTO DEL NARRADOR</div><h1>Conflicto</h1>
      <section class="card">
        <h2>Estado del conflicto</h2>
        <p class="muted">Al activar el conflicto, todos los personajes creados quedan involucrados. Sus tiradas fallidas aplican la pérdida de Voluntad según el peligro.</p>
        <button class:active={gmTracker.conflict.active} on:click={() => setConflictActive(!gmTracker.conflict.active)}>{gmTracker.conflict.active ? 'Terminar conflicto' : 'Iniciar conflicto'}</button>
        <p class="muted">{gmTracker.conflict.active ? 'Conflicto activo para todos los personajes.' : 'No hay un conflicto activo.'}</p>
        {#if gmTracker.conflict.result}<p class="conflict-result">{gmTracker.conflict.result}</p>{/if}
      </section>
      <section class="card">
        <h2>Peligro</h2>
        <p class="muted">Selecciona el nivel de peligro de la situación.</p>
        <div class="danger-levels">
          {#each ['Bajo', 'Medio', 'Alto'] as danger}
            <button class:active={gmTracker.conflict.danger === danger} class="secondary" on:click={() => setConflictDanger(danger)}>{danger}</button>
          {/each}
        </div>
      </section>
      <section class="card">
        <h2>Resistencia</h2>
        <p class="muted">Resistencia inicial: 2 por personaje creado (Voluntad base 4 ÷ 2).</p>
        <div class="resistance-value">{gmTracker.conflict.resistance ?? initialConflictResistance}</div>
        <p class="muted">{createdCharacterCount} personaje(s) creado(s) · Resistencia inicial: {initialConflictResistance}</p>
        <div class="resistance-controls">
          <button class="secondary" on:click={() => adjustConflictResistance(-1)} disabled={(gmTracker.conflict.resistance ?? initialConflictResistance) <= 0}>−1</button>
          <button on:click={() => adjustConflictResistance(1)}>+1</button>
          <button class="secondary" on:click={resetConflictResistance}>Restablecer</button>
        </div>
      </section>
      <p class="sync-note">El seguimiento del conflicto se sincroniza con los jugadores de la sala. Fallo: Bajo −1 Voluntad · Medio −2 · Alto −3. El Punto de Esfuerzo puede gastarse una vez para añadir el Estado del Enfoque y repetir todos los dados.</p>
      {/if}
    </main>
  {:else if !$isGM && activeTab === 'magia'}
    <main class="content magic-content">
      <div class="eyebrow">PACTOS Y CONDICIONES</div><h1>Magia</h1>
      <p class="magic-intro">La magia funciona mediante pactos: defines qué quieres conseguir y qué estás dispuesto a entregar a cambio. El GM debe revisar y aprobar cada pacto antes de que puedas utilizarlo.</p>
      <section class="card"><h2>¿Qué quieres conseguir?</h2>
        <p>Describe el efecto del conjuro de manera muy específica. Indica exactamente qué hace, sobre quién o qué actúa, a qué distancia, durante cuánto tiempo y bajo qué circunstancias, cuando esos detalles sean relevantes. Evita expresiones vagas, interpretaciones alternativas o dobles lecturas. El texto debe permitir entender exactamente qué puede y qué no puede hacer el conjuro.</p>
        <textarea bind:value={magicEffect} rows="5" maxlength="4000" placeholder="Describe exactamente el efecto que quieres obtener..."></textarea><small class="field-hint">{magicEffect.length} / 4000 caracteres</small></section>
      <section class="card"><h2>¿Qué das a cambio?</h2>
        <p>Describe detalladamente qué pierde, entrega o sacrifica tu personaje para obtener ese efecto. El precio puede ser mecánico o narrativo: una capacidad, un recurso, una posesión, un recuerdo, una obligación, una prohibición, un vínculo u otra pérdida concreta. Explica con precisión en qué consiste y cuándo o cómo se aplica.</p>
        <textarea bind:value={magicPrice} rows="5" maxlength="4000" placeholder="Describe exactamente qué sacrifica o pierde tu personaje..."></textarea><small class="field-hint">{magicPrice.length} / 4000 caracteres</small>
        <button class="full" on:click={submitMagicPact} disabled={!magicEffect.trim() || !magicPrice.trim()}>Firmar pacto</button>{#if magicMessage}<p class="magic-message">{magicMessage}</p>{/if}</section>
      {#if getMyMagicRecord().proposals?.some((pact) => pact.status !== 'accepted')}<section class="card"><h2>Mis propuestas</h2>
        {#each [...getMyMagicRecord().proposals].filter((pact) => pact.status !== 'accepted').sort((a, b) => b.createdAt - a.createdAt) as pact}<article class="pact-item">
          <div class="pact-status" class:pending={pact.status === 'pending'} class:rejected={pact.status === 'rejected'}>{pact.status === 'pending' ? 'Pendiente de revisión' : 'Rechazado'}</div>
          <h3>¿Qué quieres conseguir?</h3><p>{pact.effect}</p><h3>¿Qué das a cambio?</h3><p>{pact.price}</p></article>{/each}</section>{/if}
      {#if getMyMagicRecord().spells?.length}<section class="card"><h2>Mis conjuros aprobados</h2>
        {#each getMyMagicRecord().spells as pact}<article class="pact-item approved-spell"><div class="pact-status accepted">Pacto aprobado</div><h3>Efecto del conjuro</h3><p>{pact.effect}</p><h3>Precio del pacto</h3><p>{pact.price}</p></article>{/each}</section>{/if}
    </main>
  {:else if $isGM && activeTab === 'magia-gm'}
    <main class="content magic-content"><div class="eyebrow">REVISIÓN DE PACTOS</div><h1>Magia</h1>
      <p class="magic-intro">Revisa que el efecto esté definido sin ambigüedades y que el sacrificio describa con claridad lo que pierde el personaje. Solo al aceptar el pacto se incorpora a la lista de conjuros del jugador.</p>
      {#each Object.entries(magicData?.players || {}) as [playerId, record]}
        {#each (record.proposals || []).filter((pact) => pact.status === 'pending') as pact}<section class="card pact-review">
          <div class="eyebrow">PROPUESTA DE {pact.playerName || 'JUGADOR'}</div><h2>¿Qué quiere conseguir?</h2><p class="pact-text">{pact.effect}</p>
          <h2>¿Qué da a cambio?</h2><p class="pact-text">{pact.price}</p><div class="pact-actions">
            <button on:click={() => updateMagicPact(playerId, pact.id, 'accepted')}>Aceptar pacto</button><button class="secondary" on:click={() => updateMagicPact(playerId, pact.id, 'rejected')}>Rechazar</button></div></section>{/each}{/each}
      {#if !Object.values(magicData?.players || {}).some((record) => (record.proposals || []).some((pact) => pact.status === 'pending'))}<section class="card"><p>No hay pactos pendientes de revisión.</p></section>{/if}
    </main>
  {:else if !$isGM && activeTab === 'notas'}
    <main class="content notes-content">
      <div class="eyebrow">CUADERNO DE PARTIDA</div>
      <h1>Notas</h1>
      <p class="notes-intro">Anota pistas, nombres, lugares, acontecimientos o cualquier detalle importante de la partida. Tus notas se guardan automáticamente y quedan asociadas a tu jugador.</p>
      <section class="card">
        <label for="player-notes">Mis notas</label>
        <textarea id="player-notes" class="player-notes" bind:value={character.notes} on:input={updateCharacter} placeholder="Escribe aquí tus notas de la partida..." rows="18"></textarea>
        <small class="muted">Guardado automático.</small>
      </section>
    </main>
  {:else if activeTab === 'reglamento'}
    <main class="content rules-content">
      <div class="eyebrow">SISTEMA DE JUEGO</div>
      <h1>Reglamento MIMPROV</h1>
      <p class="rules-intro">Resumen de las reglas para jugadores y narrador. Esta sección es de consulta y no modifica las fichas ni el seguimiento de la partida.</p>

      <section class="card">
        <h2>1. Creación de personajes</h2>
        <p>Cada personaje se define mediante su nombre, concepto, edad, apariencia, cuatro Enfoques, cuatro Rasgos y su equipo.</p>
        <ul>
          <li><strong>Enfoques:</strong> distribuye exactamente 4 puntos entre Tenacidad, Control, Astucia y Rapidez. Cada Enfoque puede tener entre 0 y 2 puntos.</li>
          <li><strong>Rasgos:</strong> escoge cuatro. Cada Rasgo aporta +1 dado cuando resulta directamente relevante para la acción.</li>
          <li><strong>Equipo:</strong> cada Rasgo proporciona tres espacios de objetos asociados. Debes completar al menos 12 objetos para terminar la creación.</li>
          <li><strong>Voluntad:</strong> comienzas con 4 puntos y tu máximo inicial también es 4.</li>
          <li><strong>Punto de Esfuerzo:</strong> comienzas con 1 punto disponible.</li>
        </ul>
      </section>

      <section class="card">
        <h2>2. Resolución de acciones</h2>
        <p>Cuando una acción tiene un resultado incierto y relevante, el narrador pide una tirada. La reserva se calcula así:</p>
        <div class="rules-formula">Enfoque + Rasgo aplicable − penalización por Estado</div>
        <ul>
          <li><strong>Enfoque:</strong> aporta tantos dados como puntos tengas en el Enfoque elegido.</li>
          <li><strong>Rasgo:</strong> añade 1 dado si el Rasgo es pertinente para la acción.</li>
          <li><strong>Estado:</strong> resta 1 dado cuando el Estado correspondiente afecta al Enfoque utilizado.</li>
          <li><strong>Ventaja:</strong> añade 1 dado a la reserva.</li>
          <li><strong>Desventaja:</strong> resta 1 dado a la reserva.</li>
          <li><strong>Reserva de 0 o menos:</strong> tira 2d6 y conserva el resultado menor.</li>
        </ul>
        <p>En una tirada normal se conserva el dado más alto. Con desventaja también se conserva el más alto de los dados que se tiren.</p>
        <div class="rules-outcomes">
          <div><strong>1–4</strong><span>Fracaso</span></div>
          <div><strong>5</strong><span>Éxito con consecuencia</span></div>
          <div><strong>6</strong><span>Éxito limpio</span></div>
        </div>
        <p>Si en una tirada aparecen dos o más resultados de 6, obtienes un <strong>éxito crítico</strong> y recuperas 1 punto de Voluntad, sin superar tu máximo.</p>
        <p class="muted">Los Estados activos no se aplican automáticamente a la tirada: el jugador debe seleccionar el Estado pertinente. Solo corresponde la penalización cuando afecta al Enfoque utilizado.</p>
      </section>

      <section class="card">
        <h2>3. Voluntad</h2>
        <p>La Voluntad representa la capacidad del personaje para sostenerse frente a la presión.</p>
        <ul>
          <li>Comienzas con 4 puntos de Voluntad.</li>
          <li>Un éxito crítico recupera 1 punto, sin superar el máximo.</li>
          <li>Al descansar recuperas 2 puntos, sin superar el máximo.</li>
          <li>Cuando llegas a 0 Voluntad, todas tus tiradas pasan a ser 2d6 conservando el resultado menor, independientemente de la reserva, la ventaja o la desventaja.</li>
        </ul>
      </section>

      <section class="card">
        <h2>4. Estados</h2>
        <p>Los Estados representan condiciones que dificultan determinadas acciones. Cada Estado aplica una penalización de −1 dado al Enfoque asociado.</p>
        <ul>
          <li><strong>Mermado — Rapidez:</strong> lesión o limitación física.</li>
          <li><strong>Deprimido — Tenacidad:</strong> enfermedad, intoxicación o debilidad.</li>
          <li><strong>Ansioso — Control:</strong> miedo, terror o intimidación.</li>
          <li><strong>Confundido — Astucia:</strong> percepción o pensamiento alterados.</li>
          <li><strong>Incapacitado — Todos:</strong> el personaje queda fuera de acción. Este Estado reemplaza a los demás y no puede acumularse con ellos.</li>
        </ul>
        <p>Descansar no elimina Estados. Cada Estado debe resolverse mediante su propio procedimiento; quitar uno no elimina los demás.</p>
      </section>

      <section class="card">
        <h2>5. Punto de Esfuerzo</h2>
        <p>Cada personaje dispone de 1 Punto de Esfuerzo.</p>
        <ul>
          <li>Después de fallar una tirada, puedes gastar el punto para repetirla.</li>
          <li>Al gastarlo, recibes el Estado asociado al Enfoque utilizado y vuelves a lanzar todos los dados de la tirada.</li>
          <li>Tenacidad añade Deprimido; Control añade Ansioso; Astucia añade Confundido; Rapidez añade Mermado.</li>
          <li>El Punto de Esfuerzo solo puede utilizarse una vez hasta recuperarlo mediante un descanso.</li>
          <li>Si la repetición también fracasa, no puedes volver a gastar ese mismo punto.</li>
        </ul>
      </section>

      <section class="card">
        <h2>6. Descanso</h2>
        <p>Al realizar un descanso:</p>
        <ul>
          <li>Recuperas 2 puntos de Voluntad, sin superar tu máximo.</li>
          <li>Recuperas tu Punto de Esfuerzo.</li>
          <li>Conservas los Estados que tengas; el descanso no los elimina.</li>
        </ul>
      </section>

      <section class="card">
        <h2>7. Conflictos</h2>
        <p>El narrador puede activar un conflicto. Cuando lo hace, todos los personajes creados quedan involucrados.</p>
        <ul>
          <li>El conflicto tiene un nivel de peligro: <strong>Bajo, Medio o Alto</strong>.</li>
          <li>Cuando un personaje falla una tirada durante el conflicto, pierde Voluntad según el peligro: <strong>Bajo −1, Medio −2, Alto −3</strong>.</li>
          <li>La Resistencia inicial equivale a 2 puntos por cada personaje creado.</li>
          <li>El narrador puede ajustar la Resistencia manualmente. Esta no disminuye automáticamente por los fracasos.</li>
          <li>El narrador administra el nivel de peligro, la Resistencia y los Estados de los personajes.</li>
        </ul>
      </section>

      <section class="card">
        <h2>8. Dirección de juego</h2>
        <p>El narrador determina cuándo una acción requiere una tirada, qué Enfoque corresponde, si un Rasgo resulta aplicable y qué consecuencias tiene el resultado. Las reglas no establecen rondas, turnos, ataques ni movimientos automáticos: esos elementos se resuelven según la situación y la dirección del narrador.</p>
        <p>Las tiradas se realizan mediante Dice+. La aplicación sincroniza las fichas, la Voluntad, los Estados, el Punto de Esfuerzo y el estado del conflicto con la sala de Owlbear Rodeo.</p>
      </section>
    </main>
  {/if}
</div>

<style lang="scss">
  :global(body) { background:#202124; color:#eee; min-width:320px; }
  :global(button), :global(input), :global(textarea), :global(select) { font:inherit; }
  .app-shell { min-height:100vh; background:#202124; color:#eee; }
  .main-tabs { display:flex; gap:2px; background:#141516; padding:0 1rem; position:sticky; top:0; z-index:5; }
  .main-tabs button { border:0; border-bottom:3px solid transparent; background:transparent; color:#aaa; padding:1rem 1.2rem; cursor:pointer; }
  .main-tabs button.active { color:#f2c879; border-bottom-color:#d5a64b; }
  .content { width:min(900px,92%); margin:0 auto; padding:2rem 0 4rem; }
  .magic-content .magic-intro { margin:.3rem 0 1.2rem; line-height:1.7; }
  .notes-intro { margin:.3rem 0 1.2rem; line-height:1.7; }
  .player-notes { min-height:24rem; line-height:1.65; resize:vertical; }
  .magic-content .field-hint { display:block; color:#999; text-align:right; font-size:.75rem; margin-top:.3rem; }
  .magic-content textarea { min-height:7rem; line-height:1.55; }
  .magic-message { color:#f2c879; margin:.8rem 0 0; }
  .pact-item { border-top:1px solid #45484c; padding:1rem 0; }
  .pact-item:first-of-type { margin-top:.6rem; }
  .pact-item h3 { margin:.8rem 0 .25rem; }
  .pact-item p, .pact-text { white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.65; }
  .pact-status { display:inline-block; padding:.3rem .6rem; border-radius:4px; font-size:.75rem; font-weight:700; background:#393c40; color:#ddd; }
  .pact-status.pending { background:#514326; color:#f2d18e; }
  .pact-status.accepted { background:#294735; color:#a8e0b6; }
  .pact-status.rejected { background:#4c2d31; color:#f0b2b2; }
  .pact-actions { display:flex; flex-wrap:wrap; gap:.6rem; margin-top:1rem; }
  .rules-content .rules-intro { margin:.2rem 0 1.2rem; }
  .rules-content .card { padding:1.35rem 1.5rem; }
  .rules-content h2 { margin-bottom:.65rem; }
  .rules-content p { line-height:1.65; }
  .rules-content ul { color:#c7c7c7; padding-left:1.35rem; line-height:1.7; }
  .rules-content li { margin:.35rem 0; }
  .rules-content li strong, .rules-content p strong { color:#f1d49d; }
  .rules-formula { margin:1rem 0; padding:.9rem 1rem; border:1px solid #806638; border-radius:6px; background:#202225; color:#f2c879; text-align:center; font-weight:750; }
  .rules-outcomes { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.6rem; margin:1rem 0; }
  .rules-outcomes div { display:flex; flex-direction:column; gap:.25rem; align-items:center; padding:.8rem .4rem; border:1px solid #55595e; border-radius:6px; background:#202225; text-align:center; }
  .rules-outcomes strong { color:#f2c879; font-size:1.35rem; }
  .rules-outcomes span { color:#ccc; font-size:.82rem; }
  h1 { color:#f2c879; margin:.4rem 0 .8rem; font-size:1.8rem; }
  h2 { color:#f2c879; font-size:1.2rem; margin:0 0 1rem; }
  h3 { color:#e8c47f; font-size:1rem; }
  p { line-height:1.5; color:#c7c7c7; }
  .eyebrow { color:#c19a54; letter-spacing:.13em; font-size:.72rem; font-weight:700; }
  .card { background:#292b2e; border:1px solid #44474b; border-radius:9px; padding:1.2rem; margin:1rem 0; }
  label { display:block; color:#ddd; margin:1rem 0; font-size:.9rem; }
  input, textarea, select { box-sizing:border-box; display:block; width:100%; margin-top:.4rem; padding:.7rem .75rem; border-radius:5px; border:1px solid #55595e; background:#1e2022; color:#f4f4f4; }
  textarea { resize:vertical; }
  button { background:#bd9143; border:1px solid #d2a954; color:#171717; padding:.65rem 1rem; border-radius:5px; font-weight:650; cursor:pointer; }
  button:disabled { opacity:.35; cursor:not-allowed; }
  button.secondary { background:#373a3e; color:#eee; border-color:#55595e; }
  button.remove { background:transparent; color:#d9a4a4; border:0; padding:.3rem .6rem; }
  .progress { height:5px; background:#444; border-radius:4px; margin:1rem 0 1.8rem; overflow:hidden; }
  .progress span { display:block; height:100%; background:#d3a34d; transition:width .2s; }
  .wizard-actions { display:flex; justify-content:flex-end; gap:.6rem; margin-top:1.5rem; }
  .approach-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.8rem 0; border-bottom:1px solid #414448; }
  .approach-row small { display:block; color:#aaa; margin-top:.25rem; line-height:1.45; }
  .trait-description { align-items:flex-start; }
  .trait-description > div { flex:1; }
  .trait-description small { display:block; color:#aaa; margin-top:.2rem; }
  .trait-description p { margin:.35rem 0 .5rem; font-size:.85rem; }
  .trait-line strong { display:block; color:#eee; }
  .trait-line small { display:block; color:#aaa; margin-top:.2rem; }
  .trait-line p { margin:.25rem 0 .1rem; font-size:.82rem; }
  .stepper { display:flex; align-items:center; gap:.8rem; }
  .stepper button, .will-controls button { width:2rem; height:2rem; padding:0; font-size:1.1rem; }
  .stepper b { min-width:1rem; text-align:center; }
  .total-points { margin-top:1rem; color:#e1a5a5; font-weight:650; }
  .total-points.valid { color:#9bc99b; }
  .trait-picker { display:grid; grid-template-columns:1fr auto; gap:.5rem; align-items:end; }
  .name-generator { display:grid; grid-template-columns:1fr 1fr auto; gap:.55rem; align-items:end; margin:.2rem 0 .6rem; }
  .concept-generator { grid-template-columns:1fr auto; }
  .name-generator label { margin:.5rem 0; }
  .name-dice { min-height:2.65rem; white-space:nowrap; }
  @media(max-width:600px) { .name-generator { grid-template-columns:1fr 1fr; } .concept-generator { grid-template-columns:1fr; } .name-dice { grid-column:1 / -1; } }
  .trait-picker select { grid-column:1; }
  .trait-picker input { grid-column:1; }
  .trait-picker button { grid-column:2; grid-row:1; }
  .selected-item, .inventory-row { display:flex; align-items:center; justify-content:space-between; gap:.5rem; border-bottom:1px solid #414448; padding:.35rem 0; }
  .equipment-group { padding:.2rem 0 .8rem; border-bottom:1px solid #444; }
  .equipment-group h3 { margin-bottom:.2rem; }
  .inline-label { margin:.45rem 0; }
  .inline-label input { margin:0; }
  .inventory-row input { flex:1; }
  .summary { background:#202225; border-radius:6px; padding:1rem; }
  .summary h3 { margin-bottom:.2rem; }
  .sheet-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.2rem; }
  .sheet-header-actions { display:flex; flex-wrap:wrap; gap:.5rem; }
  button.danger-button { background:#4b292d; border-color:#9b555d; color:#ffd7d7; }
  .conflict-result { padding:.8rem 1rem; border:1px solid #8b713e; border-radius:6px; background:#30291d; color:#f2d18e; font-weight:650; }
  .sheet-header h1 { font-size:2rem; }
  .sheet-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
  .export-actions, .modifier-options { display:flex; flex-wrap:wrap; gap:.5rem; }
  .import-button { display:inline-flex; align-items:center; margin:0; padding:.65rem 1rem; border:1px solid #55595e; border-radius:5px; background:#373a3e; color:#eee; cursor:pointer; font-weight:650; }
  .import-button input { display:none; }
  .modifier-picker { margin:1rem 0; color:#ddd; }
  .modifier-options { margin-top:.5rem; }
  .modifier-options button.active { background:#6d542b; border-color:#d8b66f; color:#fff; }
  .pool-summary { margin:1rem 0; padding:1rem; border:1px solid #555; border-radius:6px; background:#202225; }
  .pool-summary small { display:block; color:#aaa; }
  .pool-summary strong { display:block; color:#f2c879; font-size:1.5rem; margin:.2rem 0 .7rem; }
  .pool-summary ul { margin:.5rem 0 0; padding-left:1.2rem; color:#bbb; font-size:.85rem; line-height:1.7; }
  .roll-button { width:100%; margin-top:.5rem; font-size:1rem; }
  .roll-button:disabled { opacity:.6; cursor:wait; }
  .error-message { color:#f0a0a0; margin:.7rem 0; }
  .dice-results { display:flex; flex-wrap:wrap; gap:.5rem; margin:1rem 0; }
  .die { display:grid; place-items:center; width:2.7rem; height:2.7rem; border:1px solid #777; border-radius:7px; background:#202225; color:#eee; font-size:1.3rem; font-weight:750; }
  .die.kept { border:2px solid #e0b75e; color:#f2c879; background:#514126; }
  .kept-result { color:#ccc; margin:.5rem 0; }
  .kept-result strong { color:#f2c879; font-size:1.5rem; }
  .roll-result h3 { margin:.8rem 0 .2rem; }
  .sheet-grid .card { margin:0; }
  .will-value { font-size:2.6rem; color:#f2c879; font-weight:700; }
  .will-value small { font-size:1rem; color:#aaa; }
  .will-controls { display:flex; gap:.5rem; margin:.5rem 0; }
  .muted, .sync-note { color:#999; font-size:.82rem; }
  .compact { padding:.55rem 0; }
  .compact small { display:block; max-width:26rem; color:#999; font-size:.76rem; margin-top:.2rem; line-height:1.35; }
  .score { color:#f2c879; font-weight:700; font-size:1.2rem; }
  .trait-line, .inventory-line { padding:.45rem 0; border-bottom:1px solid #414448; }
  .inventory-line small { display:block; color:#999; font-size:.72rem; }
  .full { width:100%; margin-top:.7rem; }
  .extra-info { margin:0 0 1rem; }
  .character-states { margin:0 0 1rem; }
  .state-badges { display:flex; flex-wrap:wrap; gap:.5rem; }
  .state-badge { display:inline-block; padding:.4rem .75rem; border:1px solid #9b6262; border-radius:5px; background:#492e32; color:#ffd6d6; font-weight:650; }
  .extra-info p { margin:.4rem 0; }
  .gm-content > h1 { margin-bottom:0; }
  .character-tabs { display:flex; flex-wrap:wrap; gap:.4rem; margin:.8rem 0 1rem; border-bottom:1px solid #444; padding-bottom:.6rem; }
  .character-tabs button { background:#292929; color:#ddd; border:1px solid #555; border-radius:6px; padding:.55rem .8rem; cursor:pointer; }
  .character-tabs button.active { background:#6d542b; border-color:#d8b66f; color:#fff; }
  .gm-player { border-top:1px solid #444; padding:1rem 0; }
  .gm-player-head { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
  .gm-player-head h3 { margin:.1rem 0; }
  .gm-player-head small { color:#999; }
  .gm-stats { display:grid; gap:.4rem; padding:.6rem 0; color:#ccc; font-size:.85rem; }
  .gm-stats b { color:#f1d49d; }
  .gm-player h4 { color:#d8b66f; margin:1.1rem 0 .4rem; }
  .approach-buttons { display:flex; flex-wrap:wrap; gap:.35rem; margin:.5rem 0; }
  .approach-buttons button { font-size:.75rem; padding:.45rem .6rem; }
  .state-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.4rem; }
  .check-row { display:flex; align-items:flex-start; gap:.6rem; margin:.4rem 0; padding:.5rem; background:#222427; border-radius:5px; }
  .check-row input { width:auto; margin:.2rem 0 0; }
  .check-row small { display:block; color:#999; margin-top:.2rem; }
  .danger-levels, .resistance-controls { display:flex; flex-wrap:wrap; gap:.5rem; }
  .danger-levels button.active { background:#6d542b; border-color:#d8b66f; color:#fff; }
  .resistance-value { color:#f2c879; font-size:3rem; font-weight:750; margin:.4rem 0; }
  @media(max-width:600px) {
    .sheet-grid, .state-grid { grid-template-columns:1fr; }
    .sheet-header { display:block; }
    .sheet-header-actions { margin-top:.7rem; }
    .sheet-header button { margin-top:0; }
    .trait-picker { grid-template-columns:1fr; }
    .trait-picker button { grid-column:1; grid-row:auto; }
  }
</style>