<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';
  import Themer from './components/Themer.svelte';
  import Mimprov from './components/Mimprov.svelte';
  import * as OBRHelper from './services/OBRHelper';

  onMount(() => {
    if (!OBR.isAvailable) return;

    OBRHelper.init();

    // Owlbear limita el tamaño de los popovers al espacio disponible.
    // Al abrir la acción, trasladamos la extensión a un modal de pantalla completa.
    let openingFullScreen = false;
    const unsubscribe = OBR.action.onOpenChange(async (isOpen) => {
      if (!isOpen || openingFullScreen) return;

      openingFullScreen = true;
      try {
        await OBR.modal.open({
          id: 'heunithen.dummysheet-mimprov/full-screen',
          url: window.location.href,
          fullScreen: true,
        });
        await OBR.action.close();
      } catch (error) {
        console.error('No se pudo abrir MIMPROV en pantalla completa:', error);
      } finally {
        openingFullScreen = false;
      }
    });

    return unsubscribe;
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
