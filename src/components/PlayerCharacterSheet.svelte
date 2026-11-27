<script lang="ts">
  export let character: any;
  export let states: string[] = [];
  export let effortCoins = 3;
  export let spells: any[] = [];
  export let traitLabel: (trait: string) => string = (trait) => trait;
  export let equipmentDisplayName: (item: any) => string = (item) => item?.name || '';
  export let traitDescription: (trait: string) => string = () => '';
  export let onEdit: () => void = () => {};

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
  <section class="mimprov-sheet">
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
            <article class="approach">
              <span>{approach.meaning}</span>
              <strong>{approach.name}</strong>
              <b>{Number(character.approaches?.[approach.name]) || 0}</b>
              <small>{approach.detail}</small>
            </article>
          {/each}
        </div>
      </section>

      <section class="sheet-panel">
        <h2>Rasgos</h2>
        {#if character.traits?.length}
          <div class="trait-list">
            {#each character.traits as trait}
              <article class="trait">
                <strong>{traitLabel(trait)}</strong>
                <p>{traitDescription(trait)}</p>
              </article>
            {/each}
          </div>
        {:else}
          <p class="empty-copy">No hay Rasgos registrados.</p>
        {/if}
      </section>

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
        <h2>Monedas de esfuerzo</h2>
        <div class="resource-row">
          <div class="resource-dots effort-dots" aria-label="Monedas de esfuerzo disponibles">
            {#each Array.from({ length: 3 }) as _, index}
              <span class:filled={index < effortCoins} class="resource-dot">✦</span>
            {/each}
          </div>
          <strong class="resource-value">{effortCoins} / 3</strong>
        </div>
        <p class="hint">Permiten añadir 1d6 a una tirada o repetir todos los dados ignorando las penalizaciones que reducen la reserva.</p>
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
  </section>
{/if}

<style lang="scss">
  .mimprov-sheet, .sheet-empty {
    --sheet-bg: #101512;
    --sheet-panel: #171f1a;
    --sheet-panel-inner: #1d2821;
    --sheet-line: #2b3a30;
    --sheet-text: #e9eee7;
    --sheet-muted: #aab6aa;
    --sheet-accent: #c4dc8b;
    --sheet-gold: #e4c27c;
    color: var(--sheet-text);
    font-family: 'DM Sans', sans-serif;
  }
  .mimprov-sheet {
    margin: 1.5rem auto 3rem;
    padding: clamp(1rem, 3vw, 2.1rem);
    max-width: 1120px;
    border: 1px solid #3a4b3d;
    border-radius: 16px;
    background: linear-gradient(145deg, #18221b, #121914);
    box-shadow: 0 18px 55px #0004;
  }
  .sheet-head { display:flex; justify-content:space-between; align-items:center; gap:1.2rem; flex-wrap:wrap; margin-bottom:1.5rem; padding-bottom:1.3rem; border-bottom:1px solid var(--sheet-line); }
  .sheet-identity { display:flex; align-items:center; gap:1rem; min-width:0; }
  .portrait { width:76px; height:76px; flex:0 0 76px; display:grid; place-items:center; overflow:hidden; border:1px solid #60715f; border-radius:10px; background:var(--sheet-panel-inner); color:var(--sheet-gold); font-size:2rem; }
  .portrait img { width:100%; height:100%; object-fit:cover; }
  .identity-copy { min-width:0; }
  .eyebrow { color:var(--sheet-accent); font: .68rem 'DM Mono', monospace; letter-spacing:.15em; }
  h1 { margin:.25rem 0; color:var(--sheet-accent); font:800 clamp(1.5rem, 4vw, 2.2rem) Manrope, sans-serif; line-height:1.1; overflow-wrap:anywhere; }
  .identity-copy p { margin:.25rem 0 0; color:#c4cec3; }
  .edit-button, .sheet-empty button { border:1px solid var(--sheet-accent); border-radius:7px; padding:.65rem 1rem; background:var(--sheet-accent); color:#172016; font-weight:700; cursor:pointer; }
  .sheet-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
  .sheet-panel { min-width:0; padding:1.15rem; border:1px solid var(--sheet-line); border-radius:10px; background:#111914; }
  .sheet-panel.full { grid-column:1/-1; }
  h2 { margin:0 0 1rem; color:var(--sheet-accent); font:700 1rem Manrope,sans-serif; }
  .data-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.8rem; }
  .data-grid div { min-width:0; padding:.75rem; border:1px solid var(--sheet-line); border-radius:7px; background:var(--sheet-panel-inner); }
  .data-grid span, .approach>span { display:block; margin-bottom:.35rem; color:var(--sheet-muted); font: .62rem 'DM Mono',monospace; letter-spacing:.1em; text-transform:uppercase; }
  .data-grid strong { display:block; color:var(--sheet-text); overflow-wrap:anywhere; font-size:.9rem; }
  .data-grid .wide { grid-column:1/-1; }
  .approach-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.6rem; }
  .approach { display:grid; grid-template-columns:1fr auto; gap:.25rem .5rem; align-items:center; padding:.8rem; border:1px solid var(--sheet-line); border-radius:8px; background:var(--sheet-panel-inner); }
  .approach>span { grid-column:1/-1; margin:0; color:var(--sheet-gold); }
  .approach strong { color:var(--sheet-text); font-size:.86rem; }
  .approach b { color:var(--sheet-accent); font:800 1.4rem Manrope,sans-serif; }
  .approach small { grid-column:1/-1; color:var(--sheet-muted); font-size:.72rem; line-height:1.4; }
  .trait-list, .state-list, .spell-grid { display:grid; gap:.6rem; }
  .trait, .state, .spell { padding:.8rem; border:1px solid var(--sheet-line); border-radius:8px; background:var(--sheet-panel-inner); }
  .trait strong, .state strong, .spell strong { color:var(--sheet-accent); }
  .trait p, .spell p { margin:.35rem 0 0; color:#c4cec3; font-size:.82rem; line-height:1.5; }
  .state small, .spell small, .equipment-item small { display:block; margin-top:.3rem; color:var(--sheet-muted); font-size:.72rem; line-height:1.4; }
  .resource-row { display:flex; justify-content:space-between; align-items:center; gap:.8rem; flex-wrap:wrap; }
  .resource-dots { display:flex; gap:.35rem; flex-wrap:wrap; }
  .resource-dot { width:30px; height:30px; display:grid; place-items:center; border:1px solid #66745e; border-radius:50%; background:var(--sheet-panel-inner); color:#778574; font-size:.85rem; }
  .resource-dot.filled { border-color:var(--sheet-accent); background:var(--sheet-accent); color:#172016; }
  .effort-dots .resource-dot.filled { border-color:var(--sheet-gold); background:var(--sheet-gold); }
  .resource-value { color:var(--sheet-gold); font:700 1.2rem Manrope,sans-serif; white-space:nowrap; }
  .hint, .empty-copy, .condition-note { margin:.8rem 0 0; color:var(--sheet-muted); font-size:.8rem; line-height:1.5; }
  .condition-note { color:#e4c27c; }
  .equipment-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.55rem; }
  .equipment-item { min-width:0; padding:.7rem; border:1px solid var(--sheet-line); border-radius:7px; background:var(--sheet-panel-inner); }
  .equipment-item strong { display:block; color:var(--sheet-text); font-size:.82rem; overflow-wrap:anywhere; }
  .notes { min-height:3rem; margin:0; color:#c4cec3; white-space:pre-wrap; overflow-wrap:anywhere; }
  .sheet-footnote { margin:1rem 0 0; color:var(--sheet-muted); text-align:center; font-size:.68rem; }
  .sheet-empty { margin:2rem auto; max-width:650px; padding:2rem; border:1px solid #3a4b3d; border-radius:12px; background:linear-gradient(145deg,#18221b,#121914); text-align:center; }
  .sheet-empty h1 { font-size:1.8rem; }
  .sheet-empty p { color:var(--sheet-muted); }
  @media(max-width:700px) { .sheet-grid { grid-template-columns:1fr; } .sheet-panel.full { grid-column:auto; } .equipment-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .sheet-head { align-items:flex-start; } }
  @media(max-width:430px) { .data-grid { grid-template-columns:1fr; } .data-grid .wide { grid-column:auto; } .equipment-grid { grid-template-columns:1fr; } .portrait { width:62px; height:62px; flex-basis:62px; } }
</style>
