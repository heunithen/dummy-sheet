<script lang="ts">
  import Themer from "./components/Themer.svelte";
  import { onMount } from "svelte";
  import GmBinderTabs from "./components/GMBinderTabs.svelte";
  import Sheet from "./components/Sheet.svelte";
  import CharacterCreation from "./components/CharacterCreation.svelte";
  import GMTracker from "./components/GMTracker.svelte";
  import OBR from "@owlbear-rodeo/sdk";

  import { sheet, characterCreated } from "./stores";
  import { ViewingSheet, currentPlayerId, viewingPlayerId } from "./services/OBRHelper";
  import * as OBRHelper from "./services/OBRHelper";

  const { isGM } = OBRHelper;
  let activeGMView = "sheets";
  $: isOwnSheet = $currentPlayerId === $viewingPlayerId;
  $: mainSheetVisible = isOwnSheet ? "display:block;" : "display:none;";
  $: viewingSheetVisible = isOwnSheet ? "display:none;" : "display:block";

  onMount(() => {
    if (OBR.isAvailable) OBRHelper.init();
  });

  function finishCreation(event: CustomEvent<any>) {
    $sheet = event.detail;
    $characterCreated = true;
  }

  function skipCreation() {
    $characterCreated = true;
  }
</script>

<Themer>
  <main>
    {#if $isGM}
      <nav class="gm-navigation">
        <button class:active={activeGMView === "sheets"} on:click={() => activeGMView = "sheets"}>Fichas</button>
        <button class:active={activeGMView === "tracker"} on:click={() => activeGMView = "tracker"}>Seguimiento GM</button>
      </nav>
      {#if activeGMView === "tracker"}
        <GMTracker />
      {:else}
        <GmBinderTabs />
        <div style={mainSheetVisible}>
          {#if !$characterCreated}
            <CharacterCreation on:complete={finishCreation} on:skip={skipCreation} />
          {:else}
            <Sheet bind:sheet={$sheet} />
          {/if}
        </div>
        <div style={viewingSheetVisible}>
          <Sheet bind:sheet={$ViewingSheet} />
        </div>
      {/if}
    {:else if !$characterCreated}
      <CharacterCreation on:complete={finishCreation} on:skip={skipCreation} />
    {:else}
      <Sheet bind:sheet={$sheet} />
    {/if}
  </main>
  <footer>
    <a target="_blank" href="https://github.com/kurara-ara/dummy-sheet">DummySheet original</a>
    <span>MIMPROV · Fork de DummySheet</span>
  </footer>
</Themer>

<style lang="scss">
  main { background: rgb(var(--secondary)); min-height:100%; }
  .gm-navigation { display:flex; gap:0; background:rgba(0,0,0,.25); }
  .gm-navigation button { flex:1; padding:.65rem; border:0; border-radius:0; color:rgba(var(--primary),.7); background:transparent; cursor:pointer; }
  .gm-navigation button.active { color:rgb(var(--accent)); background:rgb(var(--secondary)); }
  footer { background:rgb(var(--secondary)); clear:both; position:relative; min-height:2rem; margin-top:0; padding:1rem 2rem; display:flex; justify-content:space-between; gap:1rem; color:rgba(var(--primary),.45); font-size:.8rem; }
  footer a { text-decoration:none; color:rgb(var(--accent)); }
</style>
