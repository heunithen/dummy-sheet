<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';
  import Themer from './components/Themer.svelte';
  import Mimprov from './components/Mimprov.svelte';
  import * as OBRHelper from './services/OBRHelper';

  onMount(() => {
    if (OBR.isAvailable) OBRHelper.init();
  });
</script>

<Themer>
  <Mimprov />
</Themer>

<style lang="scss">
  :global(html), :global(body), :global(#app) {
    min-height: 100%;
    margin: 0;
  }
</style>