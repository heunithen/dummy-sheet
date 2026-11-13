import OBR from "@owlbear-rodeo/sdk";
import type { Player } from "@owlbear-rodeo/sdk";
import { sheet } from "../stores";
import { writable, get } from "svelte/store";

const SHEET_META_KEY = "com.heunithen.mimprov-dummysheet";

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
