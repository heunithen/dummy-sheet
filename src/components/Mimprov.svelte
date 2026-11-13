<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';
  import Sheet from './Sheet.svelte';
  import GmBinderTabs from './GMBinderTabs.svelte';
  import { PartyStore, currentPlayerId, isGM, ViewingSheet, viewingPlayerId } from '../services/OBRHelper';
  import { sheet } from '../stores';

  const DATA_KEY = 'com.heunithen.dummysheet-mimprov/sheet';
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
    name: string; concept: string; age: string; appearance: string; experience: string;
    approaches: Record<string, number>; traits: string[]; inventory: Item[];
    will: number; maxWill: number; created: boolean;
  };
  const blankCharacter = (): Character => ({
    name: '', concept: '', age: '', appearance: '', experience: '',
    approaches: { Tenacidad: 1, Control: 1, Astucia: 1, Rapidez: 1 },
    traits: [], inventory: [], will: 4, maxWill: 4, created: false
  });

  let character: Character = blankCharacter();
  let loaded = false;
  let step = 0;
  let approachDraft: Record<string, number> = { Tenacidad: 1, Control: 1, Astucia: 1, Rapidez: 1 };
  let traitDraft = '';
  let customTraitField = '';
  let equipmentDraft: string[] = [];
  let editingCharacter = false;
  let activeTab = 'personaje';
  let classicSheet = false;
  let gmTracker: any = { players: {}, conflict: null };
  let gmLoaded = false;
  let selectedPlayerId = '';
  let conflictReduction = 1;

  $: approachTotal = APPROACHES.reduce((sum, name) => sum + (Number(approachDraft[name]) || 0), 0);
  $: approachValid = approachTotal === 4 && APPROACHES.every(name => approachDraft[name] >= 0 && approachDraft[name] <= 2);
  $: myPlayer = $PartyStore.find(p => p.id === $currentPlayerId);
  $: partyMembers = $PartyStore.filter(p => p.role !== 'GM');
  $: selectedPlayer = partyMembers.find(p => p.id === selectedPlayerId);
  $: selectedCharacter = selectedPlayer?.metadata?.[DATA_KEY] as Character;
  $: conflictParticipants = gmTracker.conflict?.participants || [];
  $: conflictWill = conflictParticipants.reduce((sum: number, id: string) => {
    const p = partyMembers.find(x => x.id === id);
    const c = p?.metadata?.[DATA_KEY] as Character;
    return sum + (c ? Number(c.will) || 0 : 0);
  }, 0);

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
      gmTracker = raw ? JSON.parse(raw) : { players: {}, conflict: null };
    } catch { gmTracker = { players: {}, conflict: null }; }
  }
  function saveGmTracker() {
    const room = OBR.isAvailable ? OBR.room.id : 'local';
    localStorage.setItem('mimprov-gm-v1-' + room, JSON.stringify(gmTracker));
    gmTracker = clone(gmTracker);
  }
  function playerTracker(id: string) {
    if (!gmTracker.players[id]) gmTracker.players[id] = { states: [], risk: 'Ninguno', overexertionUsed: 0, overexertionNotes: [] };
    return gmTracker.players[id];
  }
  function getPlayerCharacter(player: any): Character | undefined {
    return player?.metadata?.[DATA_KEY] as Character | undefined;
  }

  function startCreation() { step = 0; character = blankCharacter(); approachDraft = { Tenacidad: 1, Control: 1, Astucia: 1, Rapidez: 1 }; }
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
  function toggleState(id: string, stateName: string) {
    const t = playerTracker(id);
    if (t.states.includes(stateName)) t.states = t.states.filter((s: string) => s !== stateName);
    else if (stateName === 'Incapacitado') t.states = ['Incapacitado'];
    else if (!t.states.includes('Incapacitado')) t.states = [...t.states.filter((s: string) => s !== 'Incapacitado'), stateName];
    saveGmTracker();
  }
  function setRisk(id: string, risk: string) { playerTracker(id).risk = risk; saveGmTracker(); }
  function setOverexertion(id: string, value: number) {
    playerTracker(id).overexertionUsed = Math.max(0, Math.min(2, value));
    saveGmTracker();
  }
  function spendOverexertion(id: string, enfoque: string) {
    const t = playerTracker(id);
    if (t.overexertionUsed >= 2) return;
    const stateByApproach: Record<string, string> = { Tenacidad: 'Deprimido', Control: 'Ansioso', Astucia: 'Confundido', Rapidez: 'Mermado' };
    const state = stateByApproach[enfoque];
    t.overexertionUsed += 1;
    if (!t.states.includes(state) && !t.states.includes('Incapacitado')) t.states = [...t.states, state];
    saveGmTracker();
  }
  function applyConflictFailure(id: string) {
    const state = gmTracker.conflict?.associatedState;
    if (!state) return;
    const t = playerTracker(id);
    if (!t.states.includes(state) && !t.states.includes('Incapacitado')) t.states = [...t.states, state];
    saveGmTracker();
  }
  function startConflict() {
    const ids = partyMembers.filter(p => gmTracker.players[p.id]?.inConflict).map(p => p.id);
    if (!ids.length) return;
    gmTracker.conflict = { participants: ids, initialResistance: ids.length * 2, resistance: ids.length * 2, round: 1, active: true, associatedState: 'Ansioso' };
    saveGmTracker();
  }
  function applyReduction() {
    if (!gmTracker.conflict?.active) return;
    gmTracker.conflict.resistance = Math.max(0, gmTracker.conflict.resistance - Math.max(0, Number(conflictReduction) || 0));
    saveGmTracker();
  }
  function nextRound() {
    if (!gmTracker.conflict?.active) return;
    if (gmTracker.conflict.round === 1) { gmTracker.conflict.round = 2; saveGmTracker(); }
  }
  function resolveConflict() {
    if (!gmTracker.conflict) return;
    gmTracker.conflict.active = false;
    gmTracker.conflict.outcome = gmTracker.conflict.resistance <= 0 ? 'Victoria decisiva'
      : gmTracker.conflict.round === 2 && conflictWill >= gmTracker.conflict.resistance ? 'Victoria por resistencia'
      : conflictParticipants.every((id: string) => {
          const p = partyMembers.find(x => x.id === id);
          const c = p?.metadata?.[DATA_KEY] as Character;
          return !c || c.will <= 0;
        }) ? 'Derrota' : 'Conflicto no superado';
    saveGmTracker();
  }
  function resetConflict() { gmTracker.conflict = null; partyMembers.forEach(p => { if (gmTracker.players[p.id]) gmTracker.players[p.id].inConflict = false; }); saveGmTracker(); }
</script>

<svelte:head>
  <title>DummySheet MIMPROV</title>
</svelte:head>

<div class="app-shell">
  <nav class="main-tabs">
    <button class:active={activeTab === 'personaje'} on:click={() => { activeTab = 'personaje'; classicSheet = false; }}>Personaje</button>
    {#if $isGM}
      <button class:active={activeTab === 'gm'} on:click={() => { activeTab = 'gm'; classicSheet = false; }}>Panel GM</button>
    {/if}
    <button class:active={activeTab === 'clasica'} on:click={() => { activeTab = 'clasica'; classicSheet = true; }}>Ficha original</button>
  </nav>

  {#if activeTab === 'personaje'}
    <main class="content">
      {#if !character.created}
        <section class="card wizard">
          <div class="eyebrow">CREACIÓN DE PERSONAJE · PASO {step + 1} DE 8</div>
          <div class="progress"><span style="width:{(step + 1) * 12.5}%"></span></div>
          {#if step === 0}
            <h1>¿Cómo se llama tu personaje?</h1>
            <label>Nombre<input bind:value={character.name} placeholder="Nombre del personaje"></label>
          {:else if step === 1}
            <h1>¿Cuál es su concepto?</h1>
            <p>Escribe una frase que describa quién es y qué lo caracteriza.</p>
            <label>Concepto<textarea bind:value={character.concept} rows="3" placeholder="Un exsoldado que ahora protege caravanas..."></textarea></label>
          {:else if step === 2}
            <h1>¿Qué edad tiene?</h1>
            <label>Edad<input bind:value={character.age} placeholder="Edad o rango aproximado"></label>
          {:else if step === 3}
            <h1>¿Cómo es su apariencia?</h1>
            <label>Apariencia<textarea bind:value={character.appearance} rows="3" placeholder="Descripción física y vestimenta"></textarea></label>
          {:else if step === 4}
            <h1>Distribuye sus Enfoques</h1>
            <p>Reparte exactamente 4 puntos. Cada Enfoque puede tener entre 0 y 2 puntos.</p>
            {#each APPROACHES as name}
              <div class="approach-row"><div><strong>{name}</strong><small>{name === 'Tenacidad' ? 'Imponerse y seguir adelante.' : name === 'Control' ? 'Actuar con calma y precisión.' : name === 'Astucia' ? 'Encontrar soluciones ingeniosas.' : 'Actuar antes de que cambie la situación.'}</small></div><div class="stepper"><button on:click={() => setApproach(name, approachDraft[name] - 1)} disabled={approachDraft[name] <= 0}>−</button><b>{approachDraft[name]}</b><button on:click={() => setApproach(name, approachDraft[name] + 1)} disabled={approachDraft[name] >= 2 || approachTotal >= 4}>+</button></div></div>
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
            <div class="selected-list">{#each character.traits as trait}<div class="selected-item"><span>{trait}</span><button class="remove" on:click={() => removeTrait(trait)}>Quitar</button></div>{/each}</div>
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
            <div class="summary"><p><strong>{character.name || 'Sin nombre'}</strong></p><p>{character.concept}</p><h3>Enfoques</h3>{#each APPROACHES as name}<p>{name}: {approachDraft[name]}</p>{/each}<h3>Rasgos</h3><p>{character.traits.join(' · ')}</p><h3>Equipo</h3><p>{character.inventory.map(i => i.name || 'Objeto por definir').join(' · ')}</p><p>Voluntad inicial: 4 / 4</p><p>Sobreesfuerzo disponible: 2</p></div>
          {/if}
          <div class="wizard-actions">
            {#if step > 0}<button class="secondary" on:click={previousStep}>Anterior</button>{/if}
            <button on:click={nextStep} disabled={(step === 1 && !character.concept.trim()) || (step === 4 && !approachValid) || (step === 5 && character.traits.length !== 4) || (step === 6 && character.inventory.length < 12)}>{step === 7 ? 'Crear personaje' : 'Continuar'}</button>
          </div>
        </section>
      {:else}
        <section class="character-sheet">
          <header class="sheet-header"><div><div class="eyebrow">PERSONAJE MIMPROV</div><h1>{character.name || 'Sin nombre'}</h1><p>{character.concept}</p></div><button class="secondary" on:click={() => editingCharacter = !editingCharacter}>{editingCharacter ? 'Cerrar edición' : 'Editar ficha'}</button></header>
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
          <div class="sheet-grid">
            <section class="card"><h2>Voluntad</h2><div class="will-value">{character.will}<small> / {character.maxWill}</small></div><div class="will-controls"><button on:click={() => adjustWill(-1)} disabled={character.will <= 0}>−</button><button on:click={() => adjustWill(1)} disabled={character.will >= character.maxWill}>+</button></div><p class="muted">Con 0 Voluntad, las tiradas usan 2d6 y conservan el menor.</p></section>
            <section class="card"><h2>Enfoques</h2>{#each APPROACHES as name}<div class="approach-row compact"><strong>{name}</strong><span class="score">{character.approaches[name]}</span></div>{/each}</section>
            <section class="card"><h2>Rasgos</h2>{#each character.traits as trait}<div class="trait-line">{trait}</div>{/each}</section>
            <section class="card"><h2>Inventario</h2>{#each character.inventory as item}<div class="inventory-line"><input bind:value={item.name} placeholder="Objeto por definir" on:input={updateCharacter}><small>{item.trait}</small><button class="remove" on:click={() => removeInventoryItem(item.id)}>×</button></div>{/each}<button class="secondary full" on:click={addInventoryItem}>Añadir objeto</button></section>
          </div>
          <section class="card extra-info"><h2>Datos del personaje</h2><p><strong>Edad:</strong> {character.age || '—'}</p><p><strong>Apariencia:</strong> {character.appearance || '—'}</p><p><strong>Experiencia:</strong> {character.experience || '—'}</p></section>
          <p class="sync-note">{OBR.isAvailable ? 'La ficha se sincroniza con Owlbear Rodeo.' : 'Modo de vista previa: la ficha se guarda en este navegador.'}</p>
        </section>
      {/if}
    </main>
  {:else if activeTab === 'gm' && $isGM}
    <main class="content gm-content">
      <div class="eyebrow">HERRAMIENTAS DEL NARRADOR</div><h1>Panel GM</h1>
      <p class="muted">Seguimiento independiente. Estos controles no modifican las fichas de los jugadores.</p>
      <section class="card"><h2>Personajes de la sala</h2>
        {#if partyMembers.length === 0}<p>No hay jugadores conectados.</p>{/if}
        {#each partyMembers as player}
          <article class="gm-player">
            <div class="gm-player-head"><div><h3>{getPlayerCharacter(player)?.name || player.name}</h3><small>{getPlayerCharacter(player)?.concept || 'Ficha MIMPROV aún no creada'}</small></div><button class="secondary" on:click={() => selectedPlayerId = selectedPlayerId === player.id ? '' : player.id}>{selectedPlayerId === player.id ? 'Cerrar' : 'Seguimiento'}</button></div>
            {#if selectedPlayerId === player.id}
              {#if getPlayerCharacter(player)}
                <div class="gm-stats"><span>Voluntad: <b>{getPlayerCharacter(player)?.will} / {getPlayerCharacter(player)?.maxWill}</b></span><span>Enfoques: <b>{APPROACHES.map(a => a + ' ' + getPlayerCharacter(player).approaches[a]).join(' · ')}</b></span><span>Rasgos: <b>{getPlayerCharacter(player)?.traits?.join(', ')}</b></span></div>
              {:else}<p class="muted">El jugador todavía no ha creado su ficha.</p>{/if}
              <h4>Estados actuales</h4><div class="state-grid">{#each STATES as state}<label class="check-row"><input type="checkbox" checked={playerTracker(player.id).states.includes(state.name)} on:change={() => toggleState(player.id, state.name)}><span><b>{state.name}</b><small>{state.enfoque}: {state.detail}</small></span></label>{/each}</div>
              <h4>Riesgo de situación</h4><select value={playerTracker(player.id).risk} on:change={(e) => setRisk(player.id, e.currentTarget.value)}><option>Ninguno</option><option>Bajo</option><option>Medio</option><option>Alto</option></select>
              <h4>Sobreesfuerzo</h4><p class="muted">Puntos disponibles: {2 - playerTracker(player.id).overexertionUsed} / 2</p><div class="stepper"><button on:click={() => setOverexertion(player.id, playerTracker(player.id).overexertionUsed - 1)} disabled={playerTracker(player.id).overexertionUsed <= 0}>−</button><b>{playerTracker(player.id).overexertionUsed} usados</b></div><div class="approach-buttons">{#each APPROACHES as enfoque}<button class="secondary" on:click={() => spendOverexertion(player.id, enfoque)} disabled={playerTracker(player.id).overexertionUsed >= 2}>{enfoque}</button>{/each}</div><small class="muted">Al registrar el gasto, el panel añade el Estado correspondiente al Enfoque utilizado.</small>
              <h4>Participación en conflicto</h4><label class="check-row"><input type="checkbox" checked={!!playerTracker(player.id).inConflict} on:change={(e) => { playerTracker(player.id).inConflict = e.currentTarget.checked; saveGmTracker(); }}><span>Incluir en el próximo conflicto</span></label>
            {/if}
          </article>
        {/each}
      </section>
      <section class="card"><h2>Conflicto</h2>
        {#if !gmTracker.conflict}
          <p>Marca los participantes en su seguimiento y comienza un conflicto. La Resistencia inicial será 2 por personaje (Voluntad base 4 ÷ 2).</p><button on:click={startConflict} disabled={!partyMembers.some(p => gmTracker.players[p.id]?.inConflict)}>Iniciar conflicto</button>
        {:else}
          <div class="conflict-summary"><div><small>Resistencia</small><strong>{gmTracker.conflict.resistance} / {gmTracker.conflict.initialResistance}</strong></div><div><small>Ronda</small><strong>{gmTracker.conflict.round} / 2</strong></div><div><small>Voluntad restante del grupo</small><strong>{conflictWill}</strong></div></div>
          <p class="muted">Participantes: {conflictParticipants.map((id: string) => partyMembers.find(p => p.id === id)?.name || 'Jugador').join(', ')}</p><label>Estado asociado al conflicto<select bind:value={gmTracker.conflict.associatedState} on:change={saveGmTracker}>{#each STATES.filter(s => s.name !== 'Incapacitado') as state}<option value={state.name}>{state.name}</option>{/each}</select></label><div class="failure-list"><strong>Registrar fracaso (1–4)</strong>{#each conflictParticipants as id}<button class="secondary" on:click={() => applyConflictFailure(id)}>{partyMembers.find(p => p.id === id)?.name || 'Jugador'}: aplicar {gmTracker.conflict.associatedState}</button>{/each}</div>
          {#if gmTracker.conflict.active}
            <div class="reduction-row"><label>Éxitos (dados con 6)<input type="number" min="0" bind:value={conflictReduction}></label><button on:click={applyReduction}>Reducir Resistencia</button></div>
            <div class="wizard-actions"><button class="secondary" on:click={nextRound} disabled={gmTracker.conflict.round >= 2}>Pasar a ronda 2</button><button on:click={resolveConflict} disabled={gmTracker.conflict.resistance > 0 && gmTracker.conflict.round < 2}>Resolver conflicto</button></div>
          {:else}<h3>Resultado: {gmTracker.conflict.outcome}</h3>{/if}
          <button class="secondary full" on:click={resetConflict}>Cerrar y reiniciar conflicto</button>
        {/if}
      </section>
      <p class="sync-note">El seguimiento del GM se guarda localmente en este dispositivo y sala. No se publica en las fichas de los jugadores.</p>
    </main>
  {:else}
    <main class="classic-content">
      {#if $isGM}<GmBinderTabs />{/if}
      <div style:display={$currentPlayerId === $viewingPlayerId ? 'block' : 'none'}><Sheet bind:sheet={$sheet} /></div>
      <div style:display={$currentPlayerId === $viewingPlayerId ? 'none' : 'block'}><Sheet bind:sheet={$ViewingSheet} /></div>
      <p class="sync-note">Vista original de DummySheet. Conserva la ficha clásica, su edición y sus herramientas.</p>
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
  .approach-row small { display:block; color:#aaa; margin-top:.25rem; }
  .stepper { display:flex; align-items:center; gap:.8rem; }
  .stepper button, .will-controls button { width:2rem; height:2rem; padding:0; font-size:1.1rem; }
  .stepper b { min-width:1rem; text-align:center; }
  .total-points { margin-top:1rem; color:#e1a5a5; font-weight:650; }
  .total-points.valid { color:#9bc99b; }
  .trait-picker { display:grid; grid-template-columns:1fr auto; gap:.5rem; align-items:end; }
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
  .sheet-header h1 { font-size:2rem; }
  .sheet-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
  .sheet-grid .card { margin:0; }
  .will-value { font-size:2.6rem; color:#f2c879; font-weight:700; }
  .will-value small { font-size:1rem; color:#aaa; }
  .will-controls { display:flex; gap:.5rem; margin:.5rem 0; }
  .muted, .sync-note { color:#999; font-size:.82rem; }
  .compact { padding:.45rem 0; }
  .score { color:#f2c879; font-weight:700; font-size:1.2rem; }
  .trait-line, .inventory-line { padding:.45rem 0; border-bottom:1px solid #414448; }
  .inventory-line small { display:block; color:#999; font-size:.72rem; }
  .full { width:100%; margin-top:.7rem; }
  .extra-info { margin-top:1rem; }
  .extra-info p { margin:.4rem 0; }
  .gm-content > h1 { margin-bottom:0; }
  .gm-player { border-top:1px solid #444; padding:1rem 0; }
  .gm-player-head { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
  .gm-player-head h3 { margin:.1rem 0; }
  .gm-player-head small { color:#999; }
  .gm-stats { display:grid; gap:.4rem; padding:.6rem 0; color:#ccc; font-size:.85rem; }
  .gm-stats b { color:#f1d49d; }
  .gm-player h4 { color:#d8b66f; margin:1.1rem 0 .4rem; }
  .approach-buttons { display:flex; flex-wrap:wrap; gap:.35rem; margin:.5rem 0; }
  .approach-buttons button { font-size:.75rem; padding:.45rem .6rem; }
  .failure-list { display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; margin:.8rem 0; }
  .failure-list strong { width:100%; color:#d8b66f; font-size:.85rem; }
  .failure-list button { font-size:.78rem; }
  .state-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.4rem; }
  .check-row { display:flex; align-items:flex-start; gap:.6rem; margin:.4rem 0; padding:.5rem; background:#222427; border-radius:5px; }
  .check-row input { width:auto; margin:.2rem 0 0; }
  .check-row small { display:block; color:#999; margin-top:.2rem; }
  .conflict-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; margin:1rem 0; }
  .conflict-summary div { background:#202225; padding:.8rem; border-radius:6px; }
  .conflict-summary small, .conflict-summary strong { display:block; }
  .conflict-summary small { color:#999; font-size:.72rem; }
  .conflict-summary strong { color:#f2c879; font-size:1.2rem; margin-top:.3rem; }
  .reduction-row { display:flex; align-items:end; gap:.7rem; }
  .reduction-row label { flex:1; margin-bottom:0; }
  .classic-content { padding:0 0 2rem; }
  @media(max-width:600px) {
    .sheet-grid, .state-grid { grid-template-columns:1fr; }
    .sheet-header { display:block; }
    .sheet-header button { margin-top:.7rem; }
    .trait-picker { grid-template-columns:1fr; }
    .trait-picker button { grid-column:1; grid-row:auto; }
    .conflict-summary { grid-template-columns:1fr; }
    .reduction-row { display:block; }
    .reduction-row button { width:100%; margin-top:.6rem; }
  }
</style>