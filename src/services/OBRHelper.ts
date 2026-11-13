import OBR from "@owlbear-rodeo/sdk";
import type { Player } from "@owlbear-rodeo/sdk";
import { sheet, gmTracker } from "../stores";
import { writable, get } from "svelte/store";

const SHEET_META_KEY = "com.heunithen.mimprov-dummysheet";
const GM_META_KEY = "com.heunithen.mimprov-gm-tracker";

const emptySheet = {
  id: 0,
  name: "",
  notes: "",
  sections: []
};

export const isGM = writable(false);
export const PartyStore = writable<Player[]>([]);
export const currentPlayerName = writable<string>("");
export const currentPlayerId = writable<string>("");
export const viewingPlayerId = writable<string>("");
export const ViewingSheet = writable<any>(emptySheet);

let ready = false;
let applyingRemoteTracker = false;

function sheetFromPlayer(player: Player) {
  return player.metadata?.[SHEET_META_KEY] ?? player.metadata?.dummysheet ?? emptySheet;
}

function refreshViewingSheet() {
  const selectedId = get(viewingPlayerId);
  const ownId = get(currentPlayerId);
  if (selectedId === ownId) {
    ViewingSheet.set(get(sheet));
    return;
  }
  const player = get(PartyStore).find((entry) => entry.id === selectedId);
  ViewingSheet.set(player ? sheetFromPlayer(player) : emptySheet);
}

export async function init() {
  if (!OBR.isAvailable) return;

  OBR.onReady(async () => {
    const playerId = await OBR.player.getId();
    currentPlayerName.set(await OBR.player.getName());
    currentPlayerId.set(playerId);
    viewingPlayerId.set(playerId);
    const role = await OBR.player.getRole();
    isGM.set(role === "GM");
    ready = true;

    if (role === "GM") {
      await initGM();
    } else {
      initPlayer();
    }
  });

  OBR.player.onChange((player) => {
    currentPlayerName.set(player.name);
    currentPlayerId.set(player.id);
    refreshViewingSheet();
  });
}

async function initGM() {
  PartyStore.set(await OBR.party.getPlayers());
  refreshViewingSheet();

  OBR.party.onChange((party) => {
    PartyStore.set(party);
    refreshViewingSheet();
  });

  viewingPlayerId.subscribe(() => refreshViewingSheet());
  sheet.subscribe(() => refreshViewingSheet());

  const roomMetadata = await OBR.room.getMetadata();
  const savedTracker = roomMetadata?.[GM_META_KEY];
  if (savedTracker && typeof savedTracker === "object") {
    applyingRemoteTracker = true;
    gmTracker.set(savedTracker);
    applyingRemoteTracker = false;
  } else {
    await OBR.room.setMetadata({ [GM_META_KEY]: get(gmTracker) });
  }

  OBR.room.onMetadataChange((metadata) => {
    const nextTracker = metadata?.[GM_META_KEY];
    if (nextTracker && typeof nextTracker === "object") {
      applyingRemoteTracker = true;
      gmTracker.set(nextTracker);
      applyingRemoteTracker = false;
    }
  });

  gmTracker.subscribe(async (tracker) => {
    if (!ready || applyingRemoteTracker || !get(isGM)) return;
    try {
      await OBR.room.setMetadata({ [GM_META_KEY]: tracker });
    } catch (error) {
      console.error("No se pudo sincronizar el seguimiento del GM.", error);
    }
  });
}

function initPlayer() {
  sheet.subscribe(async (characterSheet) => {
    if (!ready || get(isGM)) return;
    try {
      await OBR.player.setMetadata({
        [SHEET_META_KEY]: characterSheet,
        dummysheet: characterSheet
      });
    } catch (error) {
      console.error("No se pudo sincronizar la ficha del personaje.", error);
    }
  });
}
