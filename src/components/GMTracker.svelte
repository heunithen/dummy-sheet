<script lang="ts">
  import { PartyStore } from "../services/OBRHelper";
  import { gmTracker } from "../stores";

  const states = [
    { name: "Mermado", focus: "Rapidez" },
    { name: "Deprimido", focus: "Tenacidad" },
    { name: "Ansioso", focus: "Control" },
    { name: "Confundido", focus: "Astucia" },
    { name: "Incapacitado", focus: "Todos" }
  ];
  let conflictSelection: string[] = [];
  let conflictState = "Mermado";

  function readStat(player: any, sectionName: string, statName: string) {
    const section = player.metadata?.["com.heunithen.mimprov-dummysheet"]?.sections?.find((item: any) => item.name === sectionName)
      ?? player.metadata?.dummysheet?.sections?.find((item: any) => item.name === sectionName);
    return section?.stats?.find((stat: any) => stat.name === statName)?.value ?? "";
  }
  function getSheet(player: any) {
    return player.metadata?.["com.heunithen.mimprov-dummysheet"] ?? player.metadata?.dummysheet;
  }
  function snapshot(player: any) {
    const data = getSheet(player);
    const sections = data?.sections ?? [];
    const section = (name: string) => sections.find((item: any) => item.name === name)?.stats ?? [];
    const person = section("PERSONAJE");
    const focus = section("ENFOQUES");
    const traits = section("RASGOS");
    const value = (items: any[], name: string) => items.find((item: any) => item.name === name)?.value ?? "";
    return {
      id: player.id,
      playerName: player.name,
      characterName: value(person, "Nombre") || data?.name || player.name,
      concept: value(person, "Concepto"),
      will: value(person, "Voluntad"),
      effort: value(person, "Sobreesfuerzo"),
      foci: focus.map((item: any) => ({ name: item.name, value: item.value })),
      traits: traits.map((item: any) => item.name)
    };
  }
  function ensurePlayer(id: string) {
    if (!$gmTracker.players[id]) {
      $gmTracker.players[id] = { states: [], effortUsed: 0, risk: "Sin riesgo", note: "" };
      gmTracker.set({ ...$gmTracker });
    }
  }
  function updatePlayer(id: string, patch: any) {
    const current = $gmTracker.players[id] ?? { states: [], effortUsed: 0, risk: "Sin riesgo", note: "" };
    gmTracker.set({ ...$gmTracker, players: { ...$gmTracker.players, [id]: { ...current, ...patch } } });
  }
  function toggleState(id: string, state: string) {
    const current = $gmTracker.players[id]?.states ?? [];
    updatePlayer(id, { states: current.includes(state) ? current.filter((item: string) => item !== state) : [...current, state] });
  }
  function toggleParticipant(id: string) {
    conflictSelection = conflictSelection.includes(id)
      ? conflictSelection.filter((item) => item !== id)
      : [...conflictSelection, id];
  }
  function startConflict() {
    if (conflictSelection.length === 0) return;
    const resistance = conflictSelection.length * 2;
    gmTracker.set({ ...$gmTracker, conflict: { active: true, participants: [...conflictSelection], initial: resistance, remaining: resistance, round: 1, state: conflictState, result: "" } });
  }
  function reduceResistance() {
    if (!$gmTracker.conflict?.active) return;
    const remaining = Math.max(0, $gmTracker.conflict.remaining - 1);
    gmTracker.set({ ...$gmTracker, conflict: { ...$gmTracker.conflict, remaining, active: remaining > 0, result: remaining === 0 ? "Victoria decisiva: la Resistencia llegó a 0." : $gmTracker.conflict.result } });
  }
  function nextRound() {
    if (!$gmTracker.conflict?.active) return;
    if ($gmTracker.conflict.round >= 2) {
      gmTracker.set({ ...$gmTracker, conflict: { ...$gmTracker.conflict, active: false } });
    } else {
      gmTracker.set({ ...$gmTracker, conflict: { ...$gmTracker.conflict, round: 2 } });
    }
  }
  function endConflict() {
    gmTracker.set({ ...$gmTracker, conflict: { ...$gmTracker.conflict, active: false } });
  }
</script>

<section class="gm-panel">
  <header>
    <div><p class="eyebrow">MIMPROV</p><h1>Seguimiento del Narrador</h1></div>
    <p>Panel independiente. Los controles de esta vista no modifican las fichas de los jugadores.</p>
  </header>

  <section class="global-risk">
    <h2>Riesgo de la situación</h2>
    <p>Recordatorio para el Narrador. El panel no aplica pérdidas de Voluntad.</p>
    <div class="risk-row">
      <select bind:value={$gmTracker.risk} on:change={() => gmTracker.set({ ...$gmTracker })}>
        <option>Sin riesgo</option><option>Riesgo bajo</option><option>Riesgo medio</option><option>Riesgo alto</option>
      </select>
      <input placeholder="Nota sobre la situación" bind:value={$gmTracker.riskNote} on:change={() => gmTracker.set({ ...$gmTracker })} />
    </div>
  </section>

  <section class="roster">
    <h2>Personajes</h2>
    {#if $PartyStore.length === 0}
      <p>No hay otros jugadores conectados en la sala.</p>
    {/if}
    {#each $PartyStore as player (player.id)}
      {@const data = snapshot(player)}
      {@const tracking = $gmTracker.players[player.id] ?? { states: [], effortUsed: 0, risk: "Sin riesgo", note: "" }}
      {#if getSheet(player)}
        <article class="character">
          <div class="character-head">
            <div><h3>{data.characterName}</h3><small>Jugador: {data.playerName}</small></div>
            <span class="will">Voluntad {data.will || "—"}</span>
          </div>
          {#if data.concept}<p class="concept">{data.concept}</p>{/if}
          <div class="columns">
            <div><h4>Enfoques</h4>
              {#each data.foci as focus}<p class="stat"><span>{focus.name}</span><b>{focus.value}</b></p>{/each}
            </div>
            <div><h4>Rasgos elegidos</h4>
              {#each data.traits as trait}<span class="tag">{trait}</span>{/each}
            </div>
          </div>
          <div class="tracking">
            <div class="tracking-head"><h4>Estados (anotación del GM)</h4></div>
            <div class="state-list">
              {#each states as state}
                <label><input type="checkbox" checked={tracking.states.includes(state.name)} on:change={() => toggleState(player.id, state.name)} />{state.name} <small>−1d6 {state.focus === "Todos" ? "en todos los Enfoques" : state.focus}</small></label>
              {/each}
            </div>
            <div class="effort">
              <b>Sobreesfuerzo</b>
              <span>{Math.max(0, 2 - tracking.effortUsed)} / 2 disponibles</span>
              <button on:click={() => updatePlayer(player.id, { effortUsed: Math.min(2, tracking.effortUsed + 1) })} disabled={tracking.effortUsed >= 2}>Registrar uso</button>
              <button class="secondary" on:click={() => updatePlayer(player.id, { effortUsed: Math.max(0, tracking.effortUsed - 1) })} disabled={tracking.effortUsed <= 0}>Deshacer</button>
            </div>
            <div class="risk-row">
              <select value={tracking.risk} on:change={(event) => updatePlayer(player.id, { risk: event.currentTarget.value })}>
                <option>Sin riesgo</option><option>Riesgo bajo</option><option>Riesgo medio</option><option>Riesgo alto</option>
              </select>
              <input value={tracking.note} placeholder="Nota del GM" on:change={(event) => updatePlayer(player.id, { note: event.currentTarget.value })} />
            </div>
          </div>
        </article>
      {/if}
    {/each}
  </section>

  <section class="conflict">
    <h2>Seguimiento de conflicto</h2>
    {#if !$gmTracker.conflict?.active}
      <p>Selecciona participantes. La Resistencia inicial equivale a 2 por personaje (Voluntad base 4 ÷ 2).</p>
      <div class="participants">
        {#each $PartyStore as player}
          <label><input type="checkbox" checked={conflictSelection.includes(player.id)} on:change={() => toggleParticipant(player.id)} />{snapshot(player).characterName}</label>
        {/each}
      </div>
      <label>Estado asociado al conflicto
        <select bind:value={conflictState}>{#each states as state}<option value={state.name}>{state.name}</option>{/each}</select>
      </label>
      <button on:click={startConflict} disabled={conflictSelection.length === 0}>Iniciar conflicto</button>
    {:else}
      <div class="conflict-status">
        <strong>Ronda {$gmTracker.conflict.round} de 2</strong>
        <strong>Resistencia {$gmTracker.conflict.remaining} / {$gmTracker.conflict.initial}</strong>
      </div>
      <p>Estado asociado: {$gmTracker.conflict.state}</p>
      <p>Participantes: {$gmTracker.conflict.participants.map((id) => $PartyStore.find((p) => p.id === id)?.name ?? "Jugador desconectado").join(", ")}</p>
      <div class="buttons">
        <button on:click={reduceResistance}>−1 Resistencia (resultado 6)</button>
        <button on:click={nextRound} class="secondary">Terminar ronda</button>
        <button on:click={endConflict} class="danger">Finalizar conflicto</button>
      </div>
    {/if}
  </section>
</section>

<style>
  .gm-panel { max-width: 62rem; margin:0 auto; padding:1.2rem; color:rgb(var(--primary)); }
  header { display:flex; justify-content:space-between; align-items:end; gap:1rem; border-bottom:1px solid rgba(var(--accent),.5); padding-bottom:.8rem; }
  h1,h2,h3,h4 { color:rgb(var(--accent)); margin:.2rem 0 .55rem; }
  h1 { font-size:1.6rem; } h2 { font-size:1.2rem; margin-bottom:.8rem; } h3 { font-size:1.1rem; }
  p { margin:.35rem 0 .7rem; } small { opacity:.7; }
  .eyebrow { letter-spacing:.18em; margin:0; color:rgb(var(--accent)); }
  .global-risk,.roster,.conflict { margin:1rem 0; padding:1rem; border:1px solid rgba(var(--accent),.4); }
  .risk-row { display:flex; gap:.5rem; margin-top:.5rem; }
  input:not([type=checkbox]),select { min-width:0; padding:.45rem; color:rgb(var(--primary)); background:rgb(var(--secondary)); border:1px solid rgba(var(--accent),.5); }
  .risk-row input { flex:1; }
  .character { padding:1rem 0; border-top:1px solid rgba(var(--primary),.2); }
  .character-head,.conflict-status,.effort { display:flex; justify-content:space-between; align-items:center; gap:.7rem; flex-wrap:wrap; }
  .will { color:rgb(var(--accent)); font-weight:700; }
  .concept { opacity:.8; font-style:italic; }
  .columns { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
  .stat { display:flex; justify-content:space-between; border-bottom:1px solid rgba(var(--primary),.12); padding:.15rem 0; }
  .tag { display:inline-block; margin:.15rem; padding:.2rem .45rem; border:1px solid rgba(var(--accent),.5); font-size:.85rem; }
  .tracking { background:rgba(var(--primary),.035); padding:.8rem; margin-top:.8rem; }
  .state-list { display:grid; grid-template-columns:repeat(auto-fit,minmax(10rem,1fr)); gap:.35rem; }
  .state-list label,.participants label { display:flex; align-items:center; gap:.35rem; font-size:.9rem; }
  .state-list small { font-size:.75rem; }
  .effort { margin:.8rem 0; justify-content:flex-start; }
  button { border:1px solid rgb(var(--accent)); background:rgb(var(--accent)); color:#171717; padding:.45rem .7rem; cursor:pointer; font-weight:600; }
  button:disabled { opacity:.35; cursor:not-allowed; }
  button.secondary { background:transparent; color:rgb(var(--primary)); }
  button.danger { background:#8b3030; border-color:#8b3030; color:white; }
  .participants { display:flex; flex-wrap:wrap; gap:.7rem; margin:.8rem 0; }
  .conflict-status { font-size:1.15rem; color:rgb(var(--accent)); }
  .buttons { display:flex; gap:.5rem; flex-wrap:wrap; }
  @media(max-width:560px) { header,.columns { display:block; } .risk-row { flex-direction:column; } }
</style>