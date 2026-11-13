<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { FOCI, TRAITS, makeMimprovSheet } from "../mimprov";

  const dispatch = createEventDispatcher();
  let name = "";
  let concept = "";
  let age = "";
  let appearance = "";
  let experience = "";
  let specialization = "";
  let magicEnabled = false;
  let foci: Record<string, number> = { Tenacidad: 0, Control: 0, Astucia: 0, Rapidez: 0 };
  let selectedTraits: string[] = [];

  $: pointsUsed = Object.values(foci).reduce((sum, value) => sum + value, 0);
  $: visibleTraits = TRAITS.filter((trait) => !trait.optional || magicEnabled);
  $: if (!magicEnabled && selectedTraits.includes("Arcano")) selectedTraits = selectedTraits.filter((trait) => trait !== "Arcano");
  $: canCreate = name.trim().length > 0 && concept.trim().length > 0 &&
    pointsUsed === 4 && Object.values(foci).every((value) => value <= 2) &&
    selectedTraits.length === 4 &&
    (!selectedTraits.includes("Conocedor de...") || specialization.trim().length > 0);

  function adjustFocus(focus: string, amount: number) {
    const next = foci[focus] + amount;
    if (next < 0 || next > 2 || (amount > 0 && pointsUsed >= 4)) return;
    foci = { ...foci, [focus]: next };
  }

  function toggleTrait(name: string) {
    if (selectedTraits.includes(name)) {
      selectedTraits = selectedTraits.filter((trait) => trait !== name);
    } else if (selectedTraits.length < 4) {
      selectedTraits = [...selectedTraits, name];
    }
  }

  function createCharacter() {
    if (!canCreate) return;
    dispatch("complete", makeMimprovSheet({ name, concept, age, appearance, experience, foci, traits: selectedTraits, specialization }));
  }
</script>

<section class="creation">
  <header>
    <p class="eyebrow">MIMPROV</p>
    <h1>Crear personaje</h1>
    <p>Completa los pasos para crear tu personaje. Después podrás editar libremente la ficha.</p>
  </header>

  <section class="step">
    <h2>1. Personaje</h2>
    <label>Nombre <input bind:value={name} placeholder="Nombre del personaje" /></label>
    <label>Concepto <textarea bind:value={concept} rows="2" placeholder="Una frase que describa quién es y qué lo caracteriza."></textarea></label>
    <div class="two">
      <label>Edad <input bind:value={age} /></label>
      <label>Experiencia <input bind:value={experience} placeholder="Opcional" /></label>
    </div>
    <label>Apariencia <textarea bind:value={appearance} rows="2" placeholder="Descripción física (opcional)"></textarea></label>
  </section>

  <section class="step">
    <div class="step-title">
      <h2>2. Enfoques</h2>
      <strong>{pointsUsed}/4 puntos</strong>
    </div>
    <p>Distribuye 4 puntos entre los cuatro Enfoques. Cada uno puede comenzar con un máximo de 2.</p>
    {#each FOCI as focus}
      <div class="focus">
        <div><strong>{focus.name}</strong><small>{focus.description}</small></div>
        <div class="counter">
          <button type="button" aria-label="Restar" on:click={() => adjustFocus(focus.name, -1)} disabled={foci[focus.name] === 0}>−</button>
          <b>{foci[focus.name]}</b>
          <button type="button" aria-label="Sumar" on:click={() => adjustFocus(focus.name, 1)} disabled={foci[focus.name] === 2 || pointsUsed === 4}>+</button>
        </div>
      </div>
    {/each}
  </section>

  <section class="step">
    <div class="step-title">
      <h2>3. Rasgos</h2>
      <strong>{selectedTraits.length}/4 elegidos</strong>
    </div>
    <p>Escoge cuatro Rasgos. Cada uno aporta un dado cuando es directamente relevante para una acción.</p>
    <label class="magic"><input type="checkbox" bind:checked={magicEnabled} /> La ambientación incluye magia (habilita Arcano)</label>
    <div class="traits">
      {#each visibleTraits as trait}
        <label class:selected={selectedTraits.includes(trait.name)} class="trait">
          <input type="checkbox" checked={selectedTraits.includes(trait.name)} on:change={() => toggleTrait(trait.name)} disabled={!selectedTraits.includes(trait.name) && selectedTraits.length === 4} />
          <span><b>{trait.name}</b><small>{trait.description}</small></span>
        </label>
      {/each}
    </div>
    {#if selectedTraits.includes("Conocedor de...")}
      <label>Especialidad de Conocedor de... <input bind:value={specialization} placeholder="Ej. medicina, historia, mecánica" /></label>
    {/if}
    <p class="equipment-note">Los objetos de equipo definidos para cada Rasgo se añadirán individualmente al Inventario. El equipo de Liderazgo y Superviviente aún no está definido en el reglamento y quedará señalado para completar; no se inventarán objetos.</p>
  </section>

  <button class="create" type="button" on:click={createCharacter} disabled={!canCreate}>Crear ficha</button>
  {#if !canCreate}
    <p class="validation">Para continuar: completa nombre y concepto, distribuye exactamente 4 puntos, y selecciona 4 Rasgos.</p>
  {/if}
</section>

<style>
  .creation { max-width: 54rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; color: rgb(var(--primary)); }
  header { text-align: center; margin-bottom: 1.5rem; }
  h1, h2 { color: rgb(var(--accent)); margin: .2rem 0 .6rem; }
  h1 { font-size: 1.8rem; } h2 { font-size: 1.15rem; }
  p { margin: .3rem 0 .8rem; }
  .eyebrow { letter-spacing: .2em; color: rgb(var(--accent)); font-weight: 700; }
  .step { border: 1px solid rgba(var(--accent), .45); padding: 1rem; margin: 1rem 0; }
  label { display: block; margin: .65rem 0; font-weight: 600; }
  input:not([type=checkbox]), textarea { display: block; box-sizing: border-box; width: 100%; margin-top: .25rem; padding: .55rem; color: rgb(var(--primary)); background: rgba(var(--primary), .06); border: 1px solid rgba(var(--accent), .5); }
  textarea { resize: vertical; font: inherit; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
  .step-title { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
  .step-title strong { color: rgb(var(--accent)); }
  .focus { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:.55rem 0; border-top:1px solid rgba(var(--primary),.12); }
  .focus small, .trait small { display:block; font-weight:400; opacity:.75; }
  .counter { display:flex; align-items:center; gap:.7rem; }
  .counter button { width:2rem; height:2rem; border:1px solid rgb(var(--accent)); background:transparent; color:rgb(var(--primary)); font-size:1.1rem; cursor:pointer; }
  button:disabled { opacity:.35; cursor:not-allowed; }
  .magic { display:flex; align-items:center; gap:.5rem; }
  .traits { display:grid; grid-template-columns:repeat(auto-fit,minmax(14rem,1fr)); gap:.4rem; }
  .trait { display:flex; align-items:flex-start; gap:.5rem; padding:.65rem; margin:0; border:1px solid rgba(var(--primary),.2); cursor:pointer; }
  .trait.selected { border-color:rgb(var(--accent)); background:rgba(var(--accent),.1); }
  .trait input { margin-top:.2rem; }
  .equipment-note, .validation { font-size:.88rem; opacity:.8; }
  .create { display:block; margin:1.2rem auto .5rem; padding:.75rem 2rem; border:0; background:rgb(var(--accent)); color:#171717; font-weight:700; cursor:pointer; }
  .create:disabled { opacity:.35; cursor:not-allowed; }
  @media(max-width:520px) { .two { grid-template-columns:1fr; } .focus { align-items:flex-start; } }
</style>