<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';
  import Themer from './components/Themer.svelte';
  import Mimprov from './components/Mimprov.svelte';
  import * as OBRHelper from './services/OBRHelper';

  onMount(() => {
    // Detecta cualquier elemento cuyo cursor efectivo sea una mano,
    // incluidos controles personalizados del jugador y del narrador.
    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (window.getComputedStyle(target).cursor === 'pointer') {
        target.classList.add('mimprov-clickable-hover');
      }
    };

    const handlePointerOut = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        target.classList.remove('mimprov-clickable-hover');
      }
    };

    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('pointerout', handlePointerOut);

    if (!OBR.isAvailable) {
      return () => {
        document.removeEventListener('pointerover', handlePointerOver);
        document.removeEventListener('pointerout', handlePointerOut);
      };
    }

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

    return () => {
      unsubscribe();
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
    };
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
