# DummySheet

A dummy-simple sheet for storing character data.
If you're constantly changing systems, and you don't have time to wait for a nice dev to implement your character sheet, then DummySheet is for you. Open it up, edit your sheet, and get to playing.

## How to use

- Edit the right columns by clicking on them.
- The `EDIT` button lets you edit the left columns, sections, and just about everything else.
- You can also change the theme by clicking on the colour boxes, if you want something cheerier.
- `EXPORT` your character to a convenient JSON file...
- ... and you can `IMPORT` it back again.
- The GM can view other players' sheets by looking through the tabs at the top.
- Have a fun time.


## MIMPROV adaptation

This fork adds a guided MIMPROV character-creation flow while keeping DummySheet's editable sheet, sections, notes, themes, and JSON import/export tools.

### Character creation

- Write the character's name and concept.
- Distribute 4 points among Tenacidad, Control, Astucia, and Rapidez (maximum 2 in each at creation).
- Choose 4 Traits.
- The equipment explicitly listed for each selected Trait is added as individual entries in Inventory.
- Arcano is available only when the campaign is marked as magical.

The current MIMPROV rules text does not define equipment for Liderazgo or Superviviente. Those selections are shown in an equipment-pending section instead of receiving invented items.

### GM session tracking

The GM view includes a separate tracking panel for player Enfoques, selected Rasgos, Voluntad, States, Sobreesfuerzo, situational Risk reminders, and conflict progress. GM annotations do not edit player sheets.

GM tracking is stored in the GM browser's local storage to keep it private from players. It is not synchronized between different GM devices or browsers.

### Owlbear Rodeo synchronization

Player sheets are synchronized through Owlbear Rodeo player metadata. The GM can view the connected players' sheets and changes as they are made. The extension continues to use the original DummySheet sheet editor and customization features.
