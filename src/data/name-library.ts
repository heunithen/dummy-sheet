const names = {
  fantasy: {
    masculine: ["Aelar","Aldric","Alaric","Aldren","Arannis","Arius","Baelor","Bastian","Caelan","Caspian","Cedric","Daeron","Darian","Darius","Draven","Eldric","Eryndor","Faelar","Fenric","Gareth","Gideon","Hadrian","Kaelen","Kaelor","Kael","Lorien","Lucan","Magnus","Maelor","Theron","Vaelor","Valen","Zephyr","Aeron","Arden","Bram","Corvin","Dain","Evander","Galen","Isen","Jareth","Leoric","Merek","Oberon","Orin","Rhydian","Silas","Tavian","Ulric","Varek","Wystan"],
    feminine: ["Aelira","Aeris","Althea","Amaris","Anwen","Aria","Aurelia","Caelia","Calista","Celene","Cerys","Daena","Elaria","Elowen","Elysia","Evelune","Faelith","Freya","Isolde","Kaela","Liora","Lyra","Maelis","Maera","Mirelle","Nerys","Nyra","Orielle","Ravena","Rowena","Saela","Seraphine","Sylvara","Thalia","Vaela","Vespera","Ysolde","Ariadne","Astra","Brienne","Elara","Illyria","Isara","Luneth","Morrigan","Nimue","Rhiannon","Selene","Talia","Zaria"],
    unisex: ["Aeris","Aryn","Ash","Auden","Cael","Ciel","Cove","Darian","Eris","Eryn","Fable","Haven","Indigo","Kael","Lior","Lumen","Marlow","Morgan","Noor","Onyx","Ori","Phoenix","Quinn","Rain","Riven","Rune","Sage","Shay","Sol","Tarin","Vale","Winter"]
  },
  contemporary: {
    masculine: ["Aaron","Adrian","Alejandro","Alex","Andrés","Benjamín","Bruno","Carlos","Cristóbal","Daniel","Diego","Dylan","Eduardo","Emilio","Esteban","Felipe","Fernando","Gabriel","Ignacio","Javier","Joaquín","Jorge","José","Lucas","Manuel","Marco","Matías","Maximiliano","Miguel","Nicolás","Pablo","Rafael","Samuel","Sebastián","Tomás","Vicente","Agustín","Alonso","Álvaro","Antonio","David","Facundo","Franco","Gael","Iván","Leonardo","Martín","Pedro","Santiago","Simón","Thiago","Valentín"],
    feminine: ["Agustina","Amanda","Amelia","Antonia","Beatriz","Camila","Carla","Catalina","Clara","Daniela","Emilia","Florencia","Francisca","Gabriela","Isidora","Josefa","Josefina","Julieta","Laura","Lucía","Magdalena","Martina","Mía","Natalia","Olivia","Pía","Renata","Sofía","Valentina","Victoria","Alicia","Ana","Aurora","Constanza","Elena","Eva","Fernanda","Isabel","Javiera","Luna","Maite","María","Paula","Rocío","Sara","Trinidad","Violeta","Amanda","Emma","Elisa"],
    unisex: ["Alex","Ariel","Cameron","Casey","Dani","Eden","Emery","Fran","Gael","Indigo","Jade","Kai","Lee","Luca","Noa","Paz","Ren","Robin","Sam","Sasha","Taylor","Ari","Cruz","Dylan","Mika","Nico","Rene","Sol","Ángel","Andy"]
  },
  futuristic: {
    masculine: ["Axton","Bex","Caelix","Cirox","Dax","Dextro","Eon","Evex","Jax","Kaiden","Kairo","Kellan","Kovax","Lex","Maddox","Nex","Orion","Pax","Quillon","Raze","Rex","Soren","Talon","Tarek","Tavian","Vex","Xander","Zarek","Zayden","Zenon","Arko","Brax","Caden","Darian","Eryx","Juno","Kade","Kian","Lazlo","Nero","Nyx","Oryn","Riven","Sylar","Teyo","Valk","Xavian","Yarik","Zeno","Zyron"],
    feminine: ["Astra","Aven","Azura","Bexley","Cyra","Dara","Echo","Elix","Eris","Ione","Jexa","Kaia","Kira","Lumi","Lyric","Mira","Nexa","Nova","Nyra","Onyxia","Oria","Rhea","Ryn","Sable","Sera","Siri","Tala","Vega","Vexa","Xara","Yuna","Zara","Aella","Ari","Calyx","Delya","Evara","Iris","Kora","Lexa","Maven","Nira","Oona","Rivena","Solara","Taryn","Vanya","Xenia","Yara","Zyra"],
    unisex: ["Aero","Axiom","Blitz","Cipher","Coda","Delta","Echo","Flux","Halo","Hex","Ion","Jett","Kestrel","Lux","Matrix","Neo","Nexus","Nova","Nyx","Orbit","Pixel","Quark","Rebel","Rift","Rune","Sable","Solis","Tesla","Vector","Vesper","Zero","Zenith"]
  }
};
const fantasyEndings = ["ar","en","ion","or","iel","ius","ael","eth","wyn","andir","aris","eon","ith","amir","orin","ayne","eron","ovar","riel","azar","eira","ara","elle","ia","issa","oria","yra","wynne","ithiel","aeris"];
const futuristicEndings = ["ix","ex","on","ax","is","yx","ar","en","ai","eo","ova","ara","yne","ium","or","tek","vex","ion","ara","eon","sys","ara"];
function combine(base: string[], endings: string[]) {
  const result = new Set<string>(base);
  for (const first of base) for (const ending of endings) {
    const stem = first.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[aeiou]$/i, "");
    const name = stem + ending;
    if (name.length >= 4 && name.length <= 13) result.add(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
  }
  return [...result].sort((a,b) => a.localeCompare(b, "es"));
}
export function getNameOptions(style: string, gender: string): string[] {
  const group = names[style as keyof typeof names] || names.fantasy;
  const base = group[gender as keyof typeof group] || group.unisex;
  if (style === "fantasy") return combine(base, fantasyEndings);
  if (style === "futuristic") return combine(base, futuristicEndings);
  return [...new Set(base)].sort((a,b) => a.localeCompare(b, "es"));
}
