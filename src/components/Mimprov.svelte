<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';
  import { PartyStore, currentPlayerId, isGM } from '../services/OBRHelper';

  const DATA_KEY = 'com.heunithen.dummysheet-mimprov/sheet';
  const STATE_KEY = 'com.heunithen.dummysheet-mimprov/player-states';
  const OVEREXERTION_KEY = 'com.heunithen.dummysheet-mimprov/player-overexertion';
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
  let gmTracker: any = { players: {}, conflict: null };
  let gmLoaded = false;
  let visibleStates: string[] = [];
  let visibleOverexertionUsed = 0;
  let selectedPlayerId = '';

  $: approachTotal = APPROACHES.reduce((sum, name) => sum + (Number(approachDraft[name]) || 0), 0);
  $: approachValid = approachTotal === 4 && APPROACHES.every(name => approachDraft[name] >= 0 && approachDraft[name] <= 2);
  $: myPlayer = $PartyStore.find(p => p.id === $currentPlayerId);
  $: partyMembers = $PartyStore.filter(p => p.role !== 'GM');
  $: selectedPlayer = partyMembers.find(p => p.id === selectedPlayerId);
  $: selectedCharacter = selectedPlayer?.metadata?.[DATA_KEY] as Character;
  $: createdCharacterCount = partyMembers.filter(p => getPlayerCharacter(p)?.created).length;
  $: initialConflictResistance = createdCharacterCount * 2;

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
          if (role === 'PLAYER') {
            const syncStates = (metadata: any) => {
              const allStates = metadata?.[STATE_KEY] || {};
              visibleStates = Array.isArray(allStates[$currentPlayerId]) ? allStates[$currentPlayerId] : [];
              const allOverexertion = metadata?.[OVEREXERTION_KEY] || {};
              visibleOverexertionUsed = Math.max(0, Math.min(2, Number(allOverexertion[$currentPlayerId]) || 0));
            };
            syncStates(await OBR.room.getMetadata());
            OBR.room.onMetadataChange(syncStates);
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
        allOverexertion[id] = Math.max(0, Math.min(2, Number(tracker.overexertionUsed) || 0));
      });
      OBR.room.setMetadata({ [STATE_KEY]: allStates, [OVEREXERTION_KEY]: allOverexertion }).catch((error) => {
        console.error('No se pudieron publicar los datos de seguimiento de los personajes', error);
      });
    }
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
  function adjustConflictResistance(delta: number) {
    const current = gmTracker.conflict?.resistance ?? initialConflictResistance;
    gmTracker.conflict.resistance = Math.max(0, current + delta);
    saveGmTracker();
  }
  function resetConflictResistance() {
    gmTracker.conflict.resistance = null;
    saveGmTracker();
  }
  function setConflictDanger(danger: string) {
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
    </nav>
  {:else}
    <nav class="main-tabs">
      <button class:active={activeTab === 'gm'} on:click={() => { activeTab = 'gm'; }}>Personajes</button>
      <button class:active={activeTab === 'conflicto'} on:click={() => { activeTab = 'conflicto'; }}>Conflicto</button>
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
          {#if visibleStates.length > 0}<section class="card character-states"><h2>Estados actuales</h2><div class="state-badges">{#each visibleStates as state}<span class="state-badge">{state}</span>{/each}</div></section>{/if}
          <section class="card extra-info"><h2>Datos del personaje</h2><p><strong>Edad:</strong> {character.age || '—'}</p><p><strong>Apariencia:</strong> {character.appearance || '—'}</p><p><strong>Experiencia:</strong> {character.experience || '—'}</p></section>
          <section class="card extra-info"><h2>Sobreesfuerzo</h2><div class="will-value">{2 - visibleOverexertionUsed}<small> / 2 puntos disponibles</small></div><p class="muted">Puntos utilizados: {visibleOverexertionUsed}</p></section>
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
          <p class="sync-note">{OBR.isAvailable ? 'La ficha se sincroniza con Owlbear Rodeo.' : 'Modo de vista previa: la ficha se guarda en este navegador.'}</p>
        </section>
      {/if}
    </main>
  {:else if $isGM && (activeTab === 'gm' || activeTab === 'conflicto')}
    <main class="content gm-content">
      {#if activeTab === 'gm'}
      <div class="eyebrow">HERRAMIENTAS DEL NARRADOR</div><h1>Personajes</h1>
      <p class="muted">Seguimiento independiente. Estos controles no modifican las fichas de los jugadores.</p>
      <section class="card"><h2>Personajes de la sala</h2>
        {#if partyMembers.length === 0}
          <p>No hay jugadores conectados.</p>
        {:else}
          <nav class="character-tabs" aria-label="Personajes">
            {#each partyMembers as player}
              <button class:active={selectedPlayerId === player.id} on:click={() => selectedPlayerId = player.id}>{getPlayerCharacter(player)?.name || player.name}</button>
            {/each}
          </nav>
          {#each partyMembers.filter(p => p.id === selectedPlayerId) as player}
            <article class="gm-player">
              <div class="gm-player-head"><div><h3>{getPlayerCharacter(player)?.name || player.name}</h3><small>{getPlayerCharacter(player)?.concept || 'Ficha MIMPROV aún no creada'}</small></div></div>
              {#if getPlayerCharacter(player)}
                <div class="gm-stats"><span>Voluntad: <b>{getPlayerCharacter(player)?.will} / {getPlayerCharacter(player)?.maxWill}</b></span><span>Enfoques: <b>{APPROACHES.map(a => a + ' ' + (getPlayerCharacter(player)?.approaches?.[a] ?? 0)).join(' · ')}</b></span><span>Rasgos: <b>{getPlayerCharacter(player)?.traits?.join(', ')}</b></span></div>
              {:else}<p class="muted">El jugador todavía no ha creado su ficha.</p>{/if}
              <h4>Estados actuales</h4><div class="state-grid">{#each STATES as state}<label class="check-row"><input type="checkbox" checked={playerTracker(player.id).states.includes(state.name)} on:change={() => toggleState(player.id, state.name)}><span><b>{state.name}</b><small>{state.enfoque}: {state.detail}</small></span></label>{/each}</div>
              <h4>Sobreesfuerzo</h4><p class="muted">Puntos disponibles: {2 - playerTracker(player.id).overexertionUsed} / 2</p><div class="stepper"><button on:click={() => setOverexertion(player.id, playerTracker(player.id).overexertionUsed - 1)} disabled={playerTracker(player.id).overexertionUsed <= 0}>−</button><b>{playerTracker(player.id).overexertionUsed} usados</b></div><div class="approach-buttons">{#each APPROACHES as enfoque}<button class="secondary" on:click={() => spendOverexertion(player.id, enfoque)} disabled={playerTracker(player.id).overexertionUsed >= 2}>{enfoque}</button>{/each}</div><small class="muted">Al registrar el gasto, el panel añade el Estado correspondiente al Enfoque utilizado.</small>
            </article>
          {/each}
        {/if}
      </section>
      <p class="sync-note">El seguimiento de personajes se guarda localmente en este dispositivo y sala.</p>
      {:else}
      <div class="eyebrow">SEGUIMIENTO DEL NARRADOR</div><h1>Conflicto</h1>
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
      <p class="sync-note">El seguimiento del conflicto se guarda localmente en este dispositivo y sala.</p>
      {/if}
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
    .sheet-header button { margin-top:.7rem; }
    .trait-picker { grid-template-columns:1fr; }
    .trait-picker button { grid-column:1; grid-row:auto; }
  }
</style>