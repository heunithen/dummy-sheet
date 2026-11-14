const names = {
  fantasy: {
    masculine: ["Aelar","Aldric","Alaric","Aldren","Arannis","Arius","Baelor","Bastian","Caelan","Caspian","Cedric","Daeron","Darian","Darius","Draven","Eldric","Eryndor","Faelar","Fenric","Gareth","Gideon","Hadrian","Kaelen","Kaelor","Kael","Lorien","Lucan","Magnus","Maelor","Theron","Vaelor","Valen","Zephyr","Aeron","Arden","Bram","Corvin","Dain","Evander","Galen","Isen","Jareth","Leoric","Merek","Oberon","Orin","Rhydian","Silas","Tavian","Ulric","Varek","Wystan"],
    feminine: ["Aelira","Aeris","Althea","Amaris","Anwen","Aria","Aurelia","Caelia","Calista","Celene","Cerys","Daena","Elaria","Elowen","Elysia","Evelune","Faelith","Freya","Isolde","Kaela","Liora","Lyra","Maelis","Maera","Mirelle","Nerys","Nyra","Orielle","Ravena","Rowena","Saela","Seraphine","Sylvara","Thalia","Vaela","Vespera","Ysolde","Ariadne","Astra","Brienne","Elara","Illyria","Isara","Luneth","Morrigan","Nimue","Rhiannon","Selene","Talia","Zaria"],
    unisex: ["Aeris","Aryn","Ash","Auden","Cael","Ciel","Cove","Darian","Eris","Eryn","Fable","Haven","Indigo","Kael","Lior","Lumen","Marlow","Morgan","Noor","Onyx","Ori","Phoenix","Quinn","Rain","Riven","Rune","Sage","Shay","Sol","Tarin","Vale","Winter"]
  },
  contemporary: {
    masculine: [
      // Alemania y países germanoparlantes
      "Adrian","Alexander","Andreas","Anton","Benjamin","Benedikt","Carl","Christian","David","Dennis","Elias","Emil","Erik","Felix","Finn","Florian","Franz","Friedrich","Hannes","Hans","Heinrich","Jakob","Johannes","Jonas","Julian","Karl","Lars","Leon","Lennard","Lukas","Manuel","Markus","Matthias","Maximilian","Moritz","Niklas","Noah","Oliver","Paul","Philipp","Sebastian","Stefan","Tobias",
      // Reino Unido e Irlanda
      "Adam","Alfie","Arthur","Callum","Charlie","Connor","Daniel","Edward","George","Harry","Henry","Jack","James","Liam","Logan","Mason","Oliver","Oscar","Owen","Rhys","Ryan","Sean","Theodore","Thomas","William","Aidan","Cian","Declan","Eoin","Finnian","Ronan",
      // Estados Unidos y Canadá
      "Aaron","Austin","Brandon","Caleb","Carter","Charles","Christopher","Dylan","Ethan","Evan","Gabriel","Grayson","Hunter","Isaac","Jacob","Jackson","Jayden","Joseph","Joshua","Levi","Lucas","Mason","Matthew","Michael","Nathan","Nicholas","Noah","Owen","Ryan","Samuel","Theodore","Wyatt","Xavier",
      // Francia y Bélgica francófona
      "Adrien","Antoine","Arthur","Baptiste","Bastien","Cédric","Clément","Étienne","Gabriel","Hugo","Jules","Léo","Louis","Lucas","Mathéo","Mathis","Maxime","Nathan","Nicolas","Noé","Raphaël","Rémi","Théo","Thomas","Valentin","Vincent",
      // España
      "Alejandro","Álvaro","Andrés","Antonio","Carlos","Daniel","Diego","Enrique","Fernando","Francisco","Gabriel","Héctor","Hugo","Javier","Jorge","José","Juan","Leo","Manuel","Marcos","Mario","Martín","Mateo","Pablo","Pedro","Sergio",
      // Italia
      "Alessandro","Andrea","Angelo","Antonio","Carlo","Davide","Edoardo","Elia","Enrico","Federico","Filippo","Francesco","Gabriele","Giacomo","Giovanni","Lorenzo","Luca","Marco","Matteo","Mattia","Michele","Niccolò","Riccardo","Roberto","Tommaso",
      // Portugal
      "Afonso","André","Bernardo","Bruno","Diogo","Duarte","Francisco","Gonçalo","Guilherme","João","José","Leonardo","Martim","Miguel","Pedro","Rafael","Rodrigo","Tomás","Tiago","Vasco",
      // Países Bajos y Flandes
      "Bram","Daan","Jesse","Lars","Luuk","Mees","Milan","Niels","Sem","Thijs","Timo","Willem","Lucas","Matthijs","Pieter",
      // Países nórdicos
      "Anders","Axel","Elias","Emil","Erik","Frederik","Gustav","Henrik","Isak","Johan","Lukas","Magnus","Mikkel","Nils","Oskar","Sander","Sven","Viktor","William","Albin","Björn","Ludvig",
      // Europa central y oriental
      "Adam","Andrej","Boris","Dávid","Jakub","Jan","Kacper","Marek","Mateusz","Milan","Pavel","Petr","Tomas","Viktor","Luka","Marko","Nikola","Stefan","Andrei","Bogdan","Mihai","Radu",
      // Chile y Sudamérica
      "Agustín","Alonso","Benjamín","Bruno","Cristóbal","Damián","Emiliano","Facundo","Felipe","Gaspar","Ignacio","Joaquín","Lautaro","Lorenzo","Lucas","Mateo","Matías","Máximo","Nicolás","Pedro","Rafael","Salvador","Santiago","Simón","Vicente","Bautista","Franco","Thiago","Valentín","Tomás","Renato","Esteban","Facundo","Ramiro"
    ],
    feminine: [
      // Alemania y países germanoparlantes
      "Ada","Amelie","Anna","Annika","Charlotte","Clara","Emilia","Emma","Frieda","Greta","Hannah"," Ida","Johanna","Katharina","Laura","Leonie","Lena","Lina","Luisa","Maja","Marie","Mia","Nele","Paula","Sophie",
      // Reino Unido e Irlanda
      "Alice","Amelia","Ava","Charlotte","Daisy","Eleanor","Ella","Emily","Evie","Florence","Freya","Grace","Harper","Isla","Lily","Matilda","Molly","Olivia","Poppy","Rosie","Ruby","Saoirse","Sophie","Willow","Aoife","Ciara","Niamh",
      // Estados Unidos y Canadá
      "Abigail","Addison","Alexis","Avery","Brooklyn","Chloe","Eleanor","Elizabeth","Ella","Emily","Emma","Evelyn","Grace","Harper","Isabella","Madison","Mia","Natalie","Olivia","Riley","Scarlett","Sofia","Victoria","Zoey",
      // Francia y Bélgica francófona
      "Adèle","Alice","Camille","Chloé","Clara","Élise","Emma","Inès","Jade","Jeanne","Juliette","Léa","Louise","Manon","Margot","Mathilde","Rose","Sarah","Zoe","Anaïs","Céline","Élodie","Lucie","Madeleine",
      // España
      "Alba","Alejandra","Alma","Ana","Carmen","Claudia","Daniela","Elena","Inés","Irene","Isabel","Jimena","Lucía","Manuela","Marina","Martina","Paula","Sofía","Valeria","Vega",
      // Italia
      "Alessia","Alice","Aurora","Beatrice","Chiara","Elena","Eleonora","Emma","Francesca","Gaia","Giulia","Giorgia","Greta","Isabella","Martina","Matilde","Sofia","Vittoria","Bianca","Camilla","Ginevra","Ludovica",
      // Portugal
      "Beatriz","Carolina","Catarina","Clara","Constança","Inês","Leonor","Madalena","Mariana","Matilde","Rita","Sofia","Mafalda","Bárbara","Joana","Teresa",
      // Países Bajos y Flandes
      "Anne","Eva","Fenna","Isa","Lieke","Lotte","Maud","Noor","Sanne","Tess","Yara","Evi","Fleur","Julia",
      // Países nórdicos
      "Astrid","Alma","Elsa","Freja","Frida","Hedda","Ida","Ingrid","Linnea","Liv","Maja","Nora","Saga","Signe","Solveig","Thea","Tilde","Wilma","Agnes","Ebba",
      // Europa central y oriental
      "Aneta","Ania","Barbora","Daria","Eliska","Eva","Hana","Ivana","Katarina","Klara","Lenka","Mila","Milena","Nina","Petra","Zuzana","Jelena","Ksenia","Marta","Olga",
      // Chile y Sudamérica
      "Agustina","Amparo","Antonia","Catalina","Emilia","Florencia","Francisca","Isidora","Josefa","Josefina","Julieta","Maite","Martina","Pía","Renata","Sofía","Trinidad","Valentina","Violeta","Amanda","Bianca","Camila","Clara","Delfina","Elena","Emilia","Guadalupe","Lola","Lucía","Malena","Milagros","Mora","Olivia","Pilar","Rocío","Salomé","Uma","Zoe"
    ],
    unisex: [
      // Uso internacional y angloparlante
      "Alex","Ari","Ash","Avery","Bailey","Blake","Cameron","Casey","Charlie","Dakota","Drew","Eden","Elliot","Emerson","Finley","Frankie","Harley","Hayden","Jamie","Jesse","Jordan","Kai","Logan","Morgan","Parker","Quinn","Reese","Riley","River","Robin","Rowan","Sage","Sam","Skyler","Taylor",
      // Europa
      "Andrea","Arden","Camille","Céleste","Dominique","Noa","Lou","Sacha","Valentine","Mika","Sascha","Kim","Luca","Nikita","Sasha",
      // Chile y Sudamérica
      "Ángel","Cruz","Dani","Fran","Gael","Guadalupe","Jazmín","Joa","Luz","Mar","Paz","René","Sol","Trinidad"
    ]
  }
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
