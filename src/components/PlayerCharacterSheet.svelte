<script lang="ts">
  export let character: any;
  export let states: string[] = [];
  export let conflictActive = false;
  export let effortCoins = 3;
  export let spells: any[] = [];
  export let traitLabel: (trait: string) => string = (trait) => trait;
  export let equipmentDisplayName: (item: any) => string = (item) => item?.name || '';
  export let traitDescription: (trait: string) => string = () => '';
  export let onEdit: () => void = () => {};
  export let selectedApproach = 'Tenacidad';
  export let approachSelected = false;
  export let selectedTrait = '';
  export let dicePool = 0;
  export let forcedLowRoll = false;
  export let effortDiceBonus = 0;
  export let pendingRoll = false;
  export let rollError = '';
  export let lastRoll: any = null;
  export let onSelectApproach: (name: string) => void = () => {};
  export let onSelectTrait: (name: string) => void = () => {};
  export let onRoll: () => void = () => {};
  export let onSpendEffort: (mode: 'extra-die' | 'reroll') => void = () => {};
  let cursorX = 0;
  let cursorY = 0;
  let cursorVisible = false;
  $: cursorDiceCount = !approachSelected ? 0 : Math.max(0, dicePool);
  function trackPointer(event: MouseEvent) {
    cursorX = event.clientX;
    cursorY = event.clientY;
    cursorVisible = true;
  }

  const approaches = [
    { name: 'Tenacidad', meaning: 'Resistir', detail: 'Soportar presión, dolor, cansancio y mantenerse firme.' },
    { name: 'Disciplina', meaning: 'Controlar', detail: 'Mantener el control, actuar con precisión y dominar impulsos.' },
    { name: 'Instinto', meaning: 'Reaccionar', detail: 'Responder con rapidez, percibir peligros y actuar espontáneamente.' },
    { name: 'Ingenio', meaning: 'Razonar', detail: 'Analizar, comprender, recordar y encontrar soluciones.' }
  ];
  const stateDetails: Record<string, string> = {
    Mermado: 'Lesión o limitación física. Afecta al Enfoque Instinto.',
    Debilitado: 'Enfermedad, intoxicación o debilidad física. Afecta al Enfoque Tenacidad.',
    Ansioso: 'Miedo, terror o intimidación. Afecta al Enfoque Disciplina.',
    Confundido: 'Percepción o pensamiento alterados. Afecta al Enfoque Ingenio.',
    Abrumado: 'Condición automática al llegar a 0 Voluntad.'
  };
  $: groupedEquipment = character?.inventory || [];
  $: characterSpells = spells || [];
</script>

{#if !character?.created}
  <section class="sheet-empty">
    <span class="eyebrow">MIMPROV · PERSONAJE</span>
    <h1>Hoja de personaje</h1>
    <p>Todavía no has creado tu personaje.</p>
    <button on:click={onEdit}>Crear personaje</button>
  </section>
{:else}
  <section class="mimprov-sheet" class:conflict-active={conflictActive} on:mousemove={trackPointer} on:mouseleave={() => cursorVisible = false}>
    <header class="sheet-head">
      <div class="sheet-identity">
        <div class="portrait">
          {#if character.portrait}
            <img src={character.portrait} alt="Retrato de {character.name}">
          {:else}
            <span>✦</span>
          {/if}
        </div>
        <div class="identity-copy">
          <span class="eyebrow">PERSONAJE MIMPROV</span>
          <h1>{character.name || 'Sin nombre'}</h1>
          <p>{character.archetype || 'Sin arquetipo'} · {character.concept || 'Sin concepto'}</p>
        </div>
      </div>
      <button class="edit-button" on:click={onEdit}>Editar ficha</button>
    </header>

    <div class="sheet-grid">
      <section class="sheet-panel full">
        <h2>Datos del personaje</h2>
        <div class="data-grid">
          <div><span>Edad</span><strong>{character.age || '—'}</strong></div>
          <div><span>Apariencia</span><strong>{character.appearance || '—'}</strong></div>
          <div class="wide"><span>Experiencia</span><strong>{character.experience || '—'}</strong></div>
        </div>
      </section>

      <section class="sheet-panel">
        <h2>Enfoques</h2>
        <div class="approach-grid">
          {#each approaches as approach}
            <button type="button" class="approach" class:selected={approachSelected && selectedApproach === approach.name} class:muted-approach={approachSelected && selectedApproach !== approach.name} aria-pressed={approachSelected && selectedApproach === approach.name} on:click={() => onSelectApproach(approach.name)}>
              <span>{approach.meaning}</span>
              <strong>{approach.name}</strong>
              <b>{Number(character.approaches?.[approach.name]) || 0}</b>
              <small>{approach.detail}</small>
            </button>
          {/each}
        </div>
        <button type="button" class="sheet-roll-button approach-roll-button" disabled={!approachSelected || pendingRoll} on:click={onRoll}>Lanzar dados</button>
        <div class="effort-controls">
          <h3>Monedas de esfuerzo</h3>
          <div class="effort-coins" aria-label="Monedas de esfuerzo disponibles">
            {#each Array.from({ length: 3 }) as _, index}
              <button type="button" class="effort-coin" class:spent={index >= effortCoins} aria-label="Gastar moneda para añadir un dado" disabled={index >= effortCoins || pendingRoll || effortDiceBonus > 0} on:click={() => onSpendEffort('extra-die')}>✦</button>
            {/each}
            <strong class="resource-value">{effortCoins} / 3</strong>
          </div>
          {#if effortDiceBonus > 0}<p class="effort-bonus">Moneda gastada: +1d6 preparado para la próxima tirada.</p>{/if}
          {#if lastRoll?.retryNotation}
            <button type="button" class="effort-reroll" on:click={() => onSpendEffort('reroll')} disabled={pendingRoll || effortCoins <= 0}>↻ Repetir tirada</button>
          {/if}
          {#if forcedLowRoll && effortDiceBonus > 0}
            <p class="condition-note">Abrumado: se mantienen los 2d6 y se conserva el menor.</p>
          {/if}
        </div>
      <section class="sheet-panel">
        <h2>Voluntad</h2>
        <div class="resource-row">
          <div class="resource-dots" aria-label="Voluntad actual">
            {#each Array.from({ length: character.maxWill || 4 }) as _, index}
              <span class:filled={index < (Number(character.will) || 0)} class="resource-dot">♥</span>
            {/each}
          </div>
          <strong class="resource-value">{character.will} / {character.maxWill}</strong>
        </div>
        {#if Number(character.will) <= 0}
          <p class="condition-note">Abrumado: todas las tiradas se realizan con 2d6 y se conserva el resultado menor.</p>
        {:else}
          <p class="hint">La Voluntad representa la capacidad del personaje para sostenerse frente a la presión.</p>
        {/if}
      </section>
      <section class="sheet-panel">
        <h2>Estados</h2>
        {#if states.length}
          <div class="state-list">
            {#each states as state}
              <article class="state">
                <strong>{state}</strong>
                <small>{stateDetails[state] || 'Condición activa del personaje.'}</small>
              </article>
            {/each}
          </div>
        {:else}
          <p class="empty-copy">No tienes Estados activos.</p>
        {/if}
      </section>
      </section>

      <section class="sheet-panel">
        <h2>Rasgos</h2>
        {#if character.traits?.length}
          <div class="trait-list">
            {#each character.traits as trait}
              <button type="button" class="trait" class:selected={selectedTrait === trait} class:muted-trait={!!selectedTrait && selectedTrait !== trait} aria-pressed={selectedTrait === trait} on:click={() => onSelectTrait(trait)}>
                <strong>{traitLabel(trait)}</strong>
                <p>{traitDescription(trait)}</p>
                <small class="trait-die">{selectedTrait === trait ? '+1d6 seleccionado' : 'Seleccionar +1d6'}</small>
              </button>
            {/each}
          </div>
        {:else}
          <p class="empty-copy">No hay Rasgos registrados.</p>
        {/if}
      </section>





      <section class="sheet-panel full">
        <h2>Equipo</h2>
        {#if groupedEquipment.length}
          <div class="equipment-grid">
            {#each groupedEquipment as item}
              <article class="equipment-item">
                <strong>{equipmentDisplayName(item) || 'Objeto sin nombre'}</strong>
                <small>{traitLabel(item.trait || 'Personal')}</small>
              </article>
            {/each}
          </div>
        {:else}
          <p class="empty-copy">No hay equipo registrado.</p>
        {/if}
      </section>

      <section class="sheet-panel full">
        <h2>Conjuros</h2>
        {#if characterSpells.length}
          <div class="spell-grid">
            {#each characterSpells as spell}
              <article class="spell">
                <strong>{spell.name || 'Conjuro'}</strong>
                <p>{spell.effect}</p>
                <small>{spell.magnitude === 'extraordinary' ? 'Magia extraordinaria' : spell.magnitude === 'moderate' ? 'Magia moderada' : 'Truco simple'} · Coste: {spell.willCost || 0} Voluntad</small>
              </article>
            {/each}
          </div>
        {:else}
          <p class="empty-copy">No has añadido conjuros.</p>
        {/if}
      </section>

      <section class="sheet-panel full">
        <h2>Notas</h2>
        <p class="notes">{character.notes || 'No hay notas para este personaje.'}</p>
      </section>
    </div>
    <p class="sheet-footnote">Hoja de personaje · MIMPROV</p>
    {#if cursorVisible}
      <div class="cursor-dice" style={`left:${cursorX + 14}px;top:${cursorY + 14}px`} aria-hidden="true">
        {#if cursorDiceCount === 0}<span class="cursor-zero">0</span>{:else}
          {#each Array.from({ length: Math.min(cursorDiceCount, 8) }) as _, index}<span>⚄</span>{/each}
          {#if cursorDiceCount > 8}<span>+{cursorDiceCount - 8}</span>{/if}
        {/if}
      </div>
    {/if}
  </section>
{/if}

<style lang="scss">
  .mimprov-sheet, .sheet-empty {
    --sheet-bg: #202124;
    --sheet-panel: #292b2e;
    --sheet-panel-inner: #202225;
    --sheet-line: #44474b;
    --sheet-text: #eeeeee;
    --sheet-muted: #b8b8b8;
    --sheet-accent: #f2c879;
    --sheet-gold: #d5a64b;
    color: var(--sheet-text);
    font-family: 'DM Sans', sans-serif;
  }
  .mimprov-sheet {
    margin: 1.5rem auto 3rem;
    padding: clamp(1rem, 3vw, 2.1rem);
    max-width: 1120px;
    border: 1px solid #806638;
    border-radius: 16px;
    background: linear-gradient(145deg, #292b2e, #202124);
    box-shadow: 0 18px 55px #0004, inset 0 0 0 999px rgba(120, 12, 24, .10);
    transition: background-color .7s ease, border-color .7s ease, box-shadow .8s ease, color .7s ease;
  }
  .mimprov-sheet.conflict-active {
    --sheet-bg:#050505;
    --sheet-panel:#111214;
    --sheet-panel-inner:#1b1c1f;
    --sheet-line:#71343a;
    --sheet-text:#f5f5f5;
    --sheet-muted:#b8b8b8;
    --sheet-accent:#f0eeee;
    --sheet-gold:#c7c7c7;
    border-color:#a52b36;
    background:linear-gradient(145deg,#101012,#030303);
    color:#f5f5f5;
  }
  .mimprov-sheet .sheet-panel,
  .mimprov-sheet .effort-controls,
  .mimprov-sheet .trait,
  .mimprov-sheet .state,
  .mimprov-sheet .spell,
  .mimprov-sheet .data-grid div,
  .mimprov-sheet .approach,
  .mimprov-sheet .effort-coin,
  .mimprov-sheet .sheet-roll-button,
  .mimprov-sheet .edit-button {
    transition: background-color .65s ease, border-color .65s ease, color .65s ease, box-shadow .65s ease;
  }
  .mimprov-sheet.conflict-active .sheet-panel,
  .mimprov-sheet.conflict-active .effort-controls,
  .mimprov-sheet.conflict-active .trait,
  .mimprov-sheet.conflict-active .state,
  .mimprov-sheet.conflict-active .spell,
  .mimprov-sheet.conflict-active .data-grid div {
    background:#111214;
    border-color:#71343a;
    color:#f5f5f5;
  }
  .mimprov-sheet.conflict-active h1,
  .mimprov-sheet.conflict-active h2,
  .mimprov-sheet.conflict-active h3,
  .mimprov-sheet.conflict-active .trait strong,
  .mimprov-sheet.conflict-active .state strong,
  .mimprov-sheet.conflict-active .spell strong,
  .mimprov-sheet.conflict-active .approach b,
  .mimprov-sheet.conflict-active .resource-value {
    color:#f2f2f2;
  }
  .mimprov-sheet.conflict-active .approach,
  .mimprov-sheet.conflict-active .effort-coin,
  .mimprov-sheet.conflict-active .sheet-roll-button,
  .mimprov-sheet.conflict-active .edit-button {
    background:#252629;
    color:#fff;
    border-color:#a52b36;
  }
  .mimprov-sheet.conflict-active .approach.selected,
  .mimprov-sheet.conflict-active .trait.selected {
    background:#3a2024;
    border-color:#d34b56;
    box-shadow:inset 0 0 0 1px #d34b56;
  }
  .mimprov-sheet.conflict-active .portrait { background:#151515; border-color:#a52b36; color:#ddd; }
  .mimprov-sheet.conflict-active .sheet-head { border-bottom-color:#71343a; }
  .mimprov-sheet.conflict-active .state { box-shadow:inset 3px 0 0 #a52b36; }
  .mimprov-sheet.conflict-active .identity-copy p,
  .mimprov-sheet.conflict-active .trait p,
  .mimprov-sheet.conflict-active .spell p,
  .mimprov-sheet.conflict-active .hint,
  .mimprov-sheet.conflict-active .empty-copy { color:#c5c5c5; }
  .sheet-head { display:flex; justify-content:space-between; align-items:center; gap:1.2rem; flex-wrap:wrap; margin-bottom:1.5rem; padding-bottom:1.3rem; border-bottom:1px solid var(--sheet-line); }
  .sheet-identity { display:flex; align-items:center; gap:1rem; min-width:0; }
  .portrait { width:76px; height:76px; flex:0 0 76px; display:grid; place-items:center; overflow:hidden; border:1px solid #806638; border-radius:10px; background:var(--sheet-panel-inner); color:var(--sheet-gold); font-size:2rem; }
  .portrait img { width:100%; height:100%; object-fit:cover; }
  .identity-copy { min-width:0; }
  .eyebrow { color:var(--sheet-accent); font: .68rem 'DM Mono', monospace; letter-spacing:.15em; }
  h1 { margin:.25rem 0; color:var(--sheet-accent); font:800 clamp(1.5rem, 4vw, 2.2rem) Manrope, sans-serif; line-height:1.1; overflow-wrap:anywhere; }
  .identity-copy p { margin:.25rem 0 0; color:#c7c7c7; }
  .edit-button, .sheet-empty button { border:1px solid var(--sheet-accent); border-radius:7px; padding:.65rem 1rem; background:var(--sheet-accent); color:#171717; font-weight:700; cursor:pointer; }
  .sheet-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
  .sheet-panel { min-width:0; padding:1.15rem; border:1px solid var(--sheet-line); border-radius:10px; background:#202225; }
  .sheet-panel.full { grid-column:1/-1; }
  h2 { margin:0 0 1rem; color:var(--sheet-accent); font:700 1rem Manrope,sans-serif; }
  .data-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.8rem; }
  .data-grid div { min-width:0; padding:.75rem; border:1px solid var(--sheet-line); border-radius:7px; background:var(--sheet-panel-inner); }
  .data-grid span, .approach>span { display:block; margin-bottom:.35rem; color:var(--sheet-muted); font: .62rem 'DM Mono',monospace; letter-spacing:.1em; text-transform:uppercase; }
  .data-grid strong { display:block; color:var(--sheet-text); overflow-wrap:anywhere; font-size:.9rem; }
  .data-grid .wide { grid-column:1/-1; }
  .approach-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.6rem; }
  .approach { width:100%; text-align:left; color:inherit; cursor:pointer; font:inherit; display:grid; grid-template-columns:1fr auto; gap:.25rem .5rem; align-items:center; padding:.8rem; border:1px solid #806638; border-radius:8px; background:#303236; box-shadow:inset 0 0 0 1px rgba(213,166,75,.12); }
  .approach>span { grid-column:1/-1; margin:0; color:var(--sheet-gold); }
  .approach.selected, .trait.selected { opacity:1 !important; filter:none !important; border-color:var(--sheet-accent); background:#373a3e; box-shadow:inset 0 0 0 1px var(--sheet-accent); }
  .approach.muted-approach { opacity:.42; filter:grayscale(1); }
  .trait.muted-trait { opacity:.35 !important; filter:grayscale(1) !important; }
  .effort-controls { margin-top:.8rem; padding:.8rem; border:1px solid var(--sheet-line); border-radius:8px; background:var(--sheet-panel-inner); }
  .effort-controls h3 { margin:0 0 .6rem; color:var(--sheet-gold); font:700 .78rem Manrope,sans-serif; }
  .effort-coins { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
  .effort-coin { width:38px; height:38px; border:1px solid var(--sheet-gold); border-radius:50%; background:var(--sheet-gold); color:#171717; font-size:1.25rem; cursor:pointer; }
  .effort-coin.spent { opacity:.25; filter:grayscale(1); cursor:not-allowed; }
  .effort-reroll { margin-top:.65rem; padding:.5rem .7rem; border:1px solid var(--sheet-line); border-radius:7px; background:#373a3e; color:var(--sheet-text); font-size:.78rem; cursor:pointer; }
  .approach-roll-button { width:100%; margin-top:.85rem; }
  .effort-bonus { margin:.7rem 0 0; color:var(--sheet-gold); font-size:.8rem; line-height:1.45; }
  .approach:focus-visible, .trait:focus-visible { outline:2px solid var(--sheet-gold); outline-offset:2px; }
  .approach strong { color:var(--sheet-text); font-size:.86rem; }
  .approach b { color:var(--sheet-accent); font:800 1.4rem Manrope,sans-serif; }
  .approach small { grid-column:1/-1; color:var(--sheet-muted); font-size:.72rem; line-height:1.4; }
  .trait-list, .state-list, .spell-grid { display:grid; gap:.6rem; }
  .trait, .state, .spell { padding:.8rem; border:1px solid var(--sheet-line); border-radius:8px; background:var(--sheet-panel-inner); }
  button.trait { width:100%; text-align:left; color:inherit; cursor:pointer; font:inherit; }
  button.trait:not(.muted-trait) { opacity:1; filter:none; border-color:#806638; background:#303236; box-shadow:inset 0 0 0 1px rgba(213,166,75,.12); }
  .trait-die { display:block; margin-top:.5rem; color:var(--sheet-gold); font-size:.72rem; }
  .roll-panel { display:grid; gap:.85rem; }
  .roll-selection-summary { display:flex; flex-wrap:wrap; gap:.6rem; }
  .roll-selection-summary>span { display:grid; gap:.2rem; padding:.65rem .8rem; border:1px solid var(--sheet-line); border-radius:7px; background:var(--sheet-panel-inner); }
  .roll-selection-summary small, .pool-readout small { color:var(--sheet-muted); font-size:.68rem; }
  .roll-selection-summary strong { color:var(--sheet-text); font-size:.84rem; }
  .penalty-tag strong { color:#f2c879; }
  .help-toggle { display:flex; align-items:flex-start; gap:.65rem; padding:.75rem; border:1px solid var(--sheet-line); border-radius:7px; background:var(--sheet-panel-inner); cursor:pointer; }
  .help-toggle input { margin-top:.2rem; accent-color:var(--sheet-accent); }
  .help-toggle span { display:grid; gap:.25rem; }
  .help-toggle strong { color:var(--sheet-text); font-size:.84rem; }
  .help-toggle small { color:var(--sheet-muted); font-size:.72rem; line-height:1.4; }
  .modifier-picker { display:grid; gap:.5rem; }
  .modifier-options, .effort-actions { display:flex; flex-wrap:wrap; gap:.5rem; }
  .modifier-options button, .effort-actions button { padding:.55rem .75rem; border:1px solid var(--sheet-line); border-radius:7px; background:var(--sheet-panel-inner); color:var(--sheet-text); cursor:pointer; }
  .modifier-options button.active { border-color:var(--sheet-accent); background:#373a3e; }
  .pool-readout { display:flex; flex-wrap:wrap; align-items:center; gap:.7rem; padding:.8rem; border:1px solid var(--sheet-line); border-radius:8px; background:var(--sheet-panel-inner); }
  .pool-readout span { color:var(--sheet-muted); font-size:.78rem; }
  .pool-readout strong { color:var(--sheet-accent); font:800 1.25rem Manrope,sans-serif; }
  .pool-readout small { flex-basis:100%; }
  .sheet-roll-button { padding:.8rem 1rem; border:1px solid var(--sheet-accent); border-radius:7px; background:var(--sheet-accent); color:#171717; font-weight:800; cursor:pointer; }
  .sheet-roll-button:disabled, .effort-actions button:disabled { opacity:.45; cursor:not-allowed; }
  .roll-error { margin:0; color:#ff9c91; font-size:.8rem; }
  .sheet-roll-result { padding:.85rem; border:1px solid var(--sheet-line); border-radius:8px; background:var(--sheet-panel-inner); }
  .result-title { display:flex; justify-content:space-between; gap:.5rem; flex-wrap:wrap; color:var(--sheet-accent); }
  .sheet-dice-results { display:flex; flex-wrap:wrap; gap:.4rem; margin:.7rem 0; }
  .sheet-dice-results span { display:grid; place-items:center; width:34px; height:34px; border:1px solid var(--sheet-line); border-radius:7px; color:var(--sheet-text); }
  .sheet-dice-results span.kept { border-color:var(--sheet-accent); background:var(--sheet-accent); color:#171717; font-weight:800; }
  .cursor-dice { position:fixed; z-index:9999; display:flex; gap:2px; pointer-events:none; filter:drop-shadow(0 2px 3px #000b); }
  .cursor-dice span { display:grid; place-items:center; width:22px; height:22px; border:1px solid #d2a954; border-radius:5px; background:#373a3e; color:#f4f4f4; font-size:15px; font-weight:800; }
  .cursor-dice .cursor-zero { width:auto; min-width:22px; padding:0 5px; font-size:14px; }
  .trait strong, .state strong, .spell strong { color:var(--sheet-accent); }
  .trait p, .spell p { margin:.35rem 0 0; color:#c7c7c7; font-size:.82rem; line-height:1.5; }
  .state small, .spell small, .equipment-item small { display:block; margin-top:.3rem; color:var(--sheet-muted); font-size:.72rem; line-height:1.4; }
  .resource-row { display:flex; justify-content:space-between; align-items:center; gap:.8rem; flex-wrap:wrap; }
  .resource-dots { display:flex; gap:.35rem; flex-wrap:wrap; }
  .resource-dot { width:30px; height:30px; display:grid; place-items:center; border:1px solid #806638; border-radius:50%; background:var(--sheet-panel-inner); color:#888888; font-size:.85rem; }
  .resource-dot.filled { border-color:var(--sheet-accent); background:var(--sheet-accent); color:#171717; }
  .effort-dots .resource-dot.filled { border-color:var(--sheet-gold); background:var(--sheet-gold); }
  .resource-value { color:var(--sheet-gold); font:700 1.2rem Manrope,sans-serif; white-space:nowrap; }
  .hint, .empty-copy, .condition-note { margin:.8rem 0 0; color:var(--sheet-muted); font-size:.8rem; line-height:1.5; }
  .condition-note { color:#f2c879; }
  .equipment-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.55rem; }
  .equipment-item { min-width:0; padding:.7rem; border:1px solid var(--sheet-line); border-radius:7px; background:var(--sheet-panel-inner); }
  .equipment-item strong { display:block; color:var(--sheet-text); font-size:.82rem; overflow-wrap:anywhere; }
  .notes { min-height:3rem; margin:0; color:#c7c7c7; white-space:pre-wrap; overflow-wrap:anywhere; }
  .sheet-footnote { margin:1rem 0 0; color:var(--sheet-muted); text-align:center; font-size:.68rem; }
  .sheet-empty { margin:2rem auto; max-width:650px; padding:2rem; border:1px solid #806638; border-radius:12px; background:linear-gradient(145deg,#292b2e,#202124); text-align:center; }
  .sheet-empty h1 { font-size:1.8rem; }
  .sheet-empty p { color:var(--sheet-muted); }
  @media(max-width:700px) { .sheet-grid { grid-template-columns:1fr; } .sheet-panel.full { grid-column:auto; } .equipment-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .sheet-head { align-items:flex-start; } }
  @media(max-width:430px) { .data-grid { grid-template-columns:1fr; } .data-grid .wide { grid-column:auto; } .equipment-grid { grid-template-columns:1fr; } .portrait { width:62px; height:62px; flex-basis:62px; } }
</style>
