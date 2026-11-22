<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';
  import { PartyStore, currentPlayerId, isGM } from '../services/OBRHelper';
  import { getNameOptions, getSurnameOptions } from '../data/name-library';
  import { getConceptOptions } from '../data/concept-library';
  import { APPEARANCE_AGES, getRandomAppearance, type AppearanceAge, type AppearanceGender } from '../data/appearance-library';
  import { GM_NPC_GENRES, getRandomGmNpcPersonality, type GmNpcGenre } from '../data/gm-npc-library';

  const DATA_KEY = 'com.heunithen.dummysheet-mimprov/sheet';
  const STATE_KEY = 'com.heunithen.dummysheet-mimprov/player-states';
  const OVEREXERTION_KEY = 'com.heunithen.dummysheet-mimprov/player-overexertion';
  const CONFLICT_KEY = 'com.heunithen.dummysheet-mimprov/conflict';
  const EFFORT_REQUEST_CHANNEL = 'com.heunithen.dummysheet-mimprov/spend-effort';
  const REST_REQUEST_CHANNEL = 'com.heunithen.dummysheet-mimprov/rest';
  const DICE_PLUS_SOURCE = 'com.heunithen.dummysheet-mimprov';
  const DELETE_CHARACTER_CHANNEL = 'com.heunithen.dummysheet-mimprov/delete-character';
  const MAGIC_KEY = 'com.heunithen.dummysheet-mimprov/magic-pacts';
  const PLAYER_MAGIC_KEY = 'com.heunithen.dummysheet-mimprov/player-magic';
  const MAGIC_SUBMIT_CHANNEL = 'com.heunithen.dummysheet-mimprov/magic-submit';
  const MAGIC_APPROVED_CHANNEL = 'com.heunithen.dummysheet-mimprov/magic-approved';
  const LINES_VEILS_KEY = 'com.heunithen.dummysheet-mimprov/lines-veils';
  const LINES_VEILS_REQUEST_CHANNEL = 'com.heunithen.dummysheet-mimprov/lines-veils-update';
  const STATES = [
    { name: 'Mermado', enfoque: 'Instinto', detail: 'Lesión o limitación física.' },
    { name: 'Deprimido', enfoque: 'Tenacidad', detail: 'Enfermedad, intoxicación o debilidad.' },
    { name: 'Ansioso', enfoque: 'Disciplina', detail: 'Miedo, terror o intimidación.' },
    { name: 'Confundido', enfoque: 'Ingenio', detail: 'Percepción o pensamiento alterados.' },
  ];
  const APPROACHES = ['Tenacidad', 'Disciplina', 'Instinto', 'Ingenio'];
  const MAGIC_CATALOG = [
  {
    "id": "catalog_1",
    "category": "Percepción",
    "name": "Ojo del rastro",
    "effect": "Percibes huellas, rastros y señales recientes que normalmente pasarían inadvertidos.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_2",
    "category": "Percepción",
    "name": "Visión oculta",
    "effect": "Ves en la oscuridad o distingues detalles a gran distancia.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_3",
    "category": "Percepción",
    "name": "Lectura de vestigios",
    "effect": "Obtienes impresiones sobre un objeto o lugar a partir de los rastros que conserva.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_4",
    "category": "Percepción",
    "name": "Sentidos compartidos",
    "effect": "Percibes durante un breve tiempo a través de los sentidos de una criatura conocida.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_5",
    "category": "Comunicación",
    "name": "Voz distante",
    "effect": "Envías un mensaje breve a alguien cuya ubicación conoces.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_6",
    "category": "Comunicación",
    "name": "Lengua universal",
    "effect": "Comprendes y te haces entender por criaturas que hablan otros idiomas.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_7",
    "category": "Comunicación",
    "name": "Eco de los ausentes",
    "effect": "Formulas preguntas sencillas a un espíritu ligado al lugar u objeto.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_8",
    "category": "Protección",
    "name": "Manto protector",
    "effect": "Una fuerza invisible amortigua un golpe o peligro inmediato.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_9",
    "category": "Protección",
    "name": "Círculo de resguardo",
    "effect": "Delimita un área pequeña que dificulta la entrada de amenazas.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_10",
    "category": "Protección",
    "name": "Velo de resistencia",
    "effect": "Protege a una criatura de un elemento o peligro concreto durante un tiempo limitado.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_11",
    "category": "Protección",
    "name": "Barrera arcana",
    "effect": "Levanta una barrera que bloquea el paso o detiene una amenaza importante.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_12",
    "category": "Restauración",
    "name": "Aliento vital",
    "effect": "Estabiliza a una criatura al borde de la muerte y la mantiene con vida.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_13",
    "category": "Restauración",
    "name": "Manos restauradoras",
    "effect": "Cierra heridas leves y alivia el dolor de una criatura.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_14",
    "category": "Restauración",
    "name": "Purificación",
    "effect": "Elimina una contaminación, veneno o influencia menor del cuerpo o de un objeto.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_15",
    "category": "Restauración",
    "name": "Restauración profunda",
    "effect": "Revierte una alteración física o espiritual grave, si existe una forma razonable de hacerlo.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_16",
    "category": "Movimiento",
    "name": "Paso ligero",
    "effect": "Te desplazas brevemente sin hacer ruido y con mayor agilidad.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_17",
    "category": "Movimiento",
    "name": "Caída suspendida",
    "effect": "Reduce o anula el daño de una caída para una criatura.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_18",
    "category": "Movimiento",
    "name": "Salto imposible",
    "effect": "Permite superar de un salto una distancia u obstáculo extraordinarios.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_19",
    "category": "Movimiento",
    "name": "Umbral distante",
    "effect": "Abres un paso mágico entre dos lugares que puedes identificar con precisión.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_20",
    "category": "Creación",
    "name": "Lumbre evocada",
    "effect": "Creas una pequeña llama o fuente de luz que dura un tiempo limitado.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_21",
    "category": "Creación",
    "name": "Manos invisibles",
    "effect": "Manipulas objetos pequeños a distancia, como si una mano invisible los moviera.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_22",
    "category": "Transformación",
    "name": "Forma prestada",
    "effect": "Alteras temporalmente un rasgo visible de tu apariencia o la de otra criatura.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_23",
    "category": "Transformación",
    "name": "Materia mutable",
    "effect": "Cambias temporalmente la forma o consistencia de una cantidad limitada de materia.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_24",
    "category": "Control",
    "name": "Raíces apresadoras",
    "effect": "Haces surgir raíces, lianas o fibras que inmovilizan a un objetivo o bloquean un paso.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_25",
    "category": "Control",
    "name": "Orden imperceptible",
    "effect": "Implantas una instrucción breve y sencilla que una criatura puede resistir.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_26",
    "category": "Control",
    "name": "Dominio elemental",
    "effect": "Manipulas una masa importante de agua, fuego, aire o tierra dentro de límites claros.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_27",
    "category": "Control",
    "name": "Voluntad sometida",
    "effect": "Restringes temporalmente las acciones de una criatura que no logra resistir el conjuro.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_28",
    "category": "Daño",
    "name": "Proyectil arcano",
    "effect": "Lanzas un impacto mágico preciso contra un objetivo visible.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_29",
    "category": "Daño",
    "name": "Estallido elemental",
    "effect": "Provocas una explosión localizada de fuego, hielo, electricidad u otra fuerza elemental.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_30",
    "category": "Daño",
    "name": "Lanza devastadora",
    "effect": "Concentras energía en un ataque mágico de gran potencia contra un objetivo.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_31",
    "category": "Daño",
    "name": "Tormenta desatada",
    "effect": "Desatas una fuerza elemental sobre una zona amplia, afectando a varios objetivos expuestos.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_32",
    "category": "Ilusión",
    "name": "Imagen fugaz",
    "effect": "Creas una imagen o sonido breve que puede engañar a quien no lo examine de cerca.",
    "magnitude": "simple",
    "willCost": 1
  },
  {
    "id": "catalog_33",
    "category": "Ilusión",
    "name": "Rostro ajeno",
    "effect": "Adoptas la apariencia de otra persona durante un tiempo limitado.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_34",
    "category": "Ilusión",
    "name": "Escenario ilusorio",
    "effect": "Proyectas una escena compleja que altera lo que otros ven y oyen en un área.",
    "magnitude": "extraordinary",
    "willCost": 3
  },
  {
    "id": "catalog_35",
    "category": "Invocación",
    "name": "Familiar espiritual",
    "effect": "Llamas a un pequeño espíritu que observa, transmite señales o realiza tareas sencillas.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_36",
    "category": "Invocación",
    "name": "Compañero salvaje",
    "effect": "Convocas temporalmente una criatura natural que puede ayudarte en tareas sencillas.",
    "magnitude": "moderate",
    "willCost": 2
  },
  {
    "id": "catalog_37",
    "category": "Invocación",
    "name": "Guardián espectral",
    "effect": "Invocas una presencia protectora que defiende un lugar o a una criatura durante un tiempo limitado.",
    "magnitude": "extraordinary",
    "willCost": 3
  }
] as const;
  const ARCHETYPES: Record<string, { description: string; approaches: Record<string, number>; traits: string[] }> = {
    'Valiente': { description: 'Se enfrenta a los peligros sin retroceder. Actúa con decisión cuando otros dudan, soporta la presión y está dispuesto a ponerse en riesgo para proteger o defender aquello que considera importante.', approaches: { Tenacidad: 1, Disciplina: 0, Instinto: 1, Ingenio: 0 }, traits: ['Peleador', 'Superviviente'] },
    'Místico': { description: 'Se interesa por lo oculto, lo inexplicable y las fuerzas que escapan a la comprensión cotidiana. Observa señales, busca significados y conoce prácticas, tradiciones o saberes poco comunes.', approaches: { Tenacidad: 0, Disciplina: 1, Instinto: 1, Ingenio: 0 }, traits: ['Observador', 'Conocedor de...'] },
    'Académico': { description: 'Se apoya en el estudio, la investigación y el pensamiento metódico. Reúne información, examina pruebas y utiliza conocimientos especializados para comprender problemas y encontrar respuestas.', approaches: { Tenacidad: 0, Disciplina: 1, Instinto: 0, Ingenio: 1 }, traits: ['Investigador', 'Conocedor de...'] },
    'Atlético': { description: 'Destaca por su preparación física y el dominio de su cuerpo. Confía en su fuerza, coordinación, velocidad y resistencia para superar obstáculos y realizar esfuerzos exigentes.', approaches: { Tenacidad: 1, Disciplina: 0, Instinto: 1, Ingenio: 0 }, traits: ['Atlético', 'Superviviente'] },
    'Sociable': { description: 'Se desenvuelve con facilidad entre otras personas. Sabe comunicarse, generar confianza, negociar y reunir voluntades para alcanzar objetivos compartidos.', approaches: { Tenacidad: 0, Disciplina: 1, Instinto: 0, Ingenio: 1 }, traits: ['Persuasivo', 'Liderazgo'] }
  };
  const TRAITS = [
    'Atlético', 'Conocedor de...', 'Espadachín', 'Investigador', 'Furtivo',
    'Intimidante', 'Liderazgo', 'Maestro Chasquilla', 'Observador',
    'Peleador', 'Persuasivo', 'Superviviente', 'Tirador'
  ];
  const GENRE_KEY = 'com.heunithen.dummysheet-mimprov/genre';
  const SESSION_KEY = 'com.heunithen.dummysheet-mimprov/session';
  const GENRES = [{id:'fantasy',label:'Fantasía'},{id:'scifi',label:'Ciencia ficción'},{id:'horror',label:'Terror'},{id:'modern',label:'Contemporánea'},{id:'postapoc',label:'Postapocalíptica'}];
  const GENRE_TRAIT_LABELS: Record<string, Record<string,string>> = {
    fantasy:{'Maestro Chasquilla':'Herrero','Tirador':'Arquero'},
    scifi:{'Conocedor de...':'Especialista en...','Espadachín':'Duelista','Investigador':'Analista','Furtivo':'Infiltrador','Liderazgo':'Coordinador','Maestro Chasquilla':'Técnico'},
    horror:{'Maestro Chasquilla':'Reparador'},
    modern:{'Maestro Chasquilla':'Técnico'},
    postapoc:{'Conocedor de...':'Experto en...','Furtivo':'Merodeador','Maestro Chasquilla':'Mecánico'}
  };
  const KNOWLEDGE_BY_GENRE: Record<string,string[]> = {
    fantasy:['Alquimia','Heráldica','Historia','Monstruos','Religión','Plantas medicinales','Minería','Arquitectura','Magia','Forja'],
    scifi:['Robótica','Medicina','Biología alienígena','Ingeniería','Programación','Navegación espacial','Xenología','Armamento','Cibernética','Astrofísica'],
    horror:['Ocultismo','Medicina forense','Leyendas locales','Psicología','Rituales','Enfermedades','Historia criminal','Fenómenos paranormales','Folclore','Anatomía'],
    modern:['Derecho','Medicina','Informática','Mecánica','Química','Finanzas','Historia','Construcción','Electrónica','Periodismo'],
    postapoc:['Medicina','Motores','Explosivos','Agricultura','Electricidad','Armas','Química','Fauna','Navegación','Purificación de agua']
  };
  const GENRE_EQUIPMENT: Record<string,Record<string,string[]>> = {
    fantasy:{'Atlético':['Cuerda de escalada','Botas de viaje','Guantes de cuero'],'Conocedor de...':['Libro de referencia','Notas de estudio','Instrumento de oficio'],'Espadachín':['Espada','Vaina','Piedra de afilar'],'Investigador':['Libreta','Lápiz de carbón','Lupa'],'Furtivo':['Capa con capucha','Ganzúas artesanales','Ropa discreta'],'Intimidante':['Armadura intimidante','Trofeo amenazador','Insignia de reputación'],'Liderazgo':['Estandarte','Cuerno de mando','Mapa de campaña'],'Maestro Chasquilla':['Martillo de herrero','Tenazas','Herramientas de forja'],'Observador':['Catalejo','Linterna','Espejo pequeño'],'Peleador':['Guantes reforzados','Vendas','Protección de cuero'],'Persuasivo':['Ropa elegante','Sello personal','Regalo de cortesía'],'Superviviente':['Cantimplora','Pedernal','Manta de viaje'],'Tirador':['Arco','Carcaj','Flechas']},
    scifi:{'Atlético':['Arnés de movilidad','Calzado magnético','Suero hidratante'],'Conocedor de...':['Terminal portátil','Base de datos','Kit de análisis'],'Espadachín':['Hoja de energía','Empuñadura de repuesto','Funda magnética'],'Investigador':['Terminal de análisis','Grabador','Escáner de evidencias'],'Furtivo':['Traje de camuflaje','Silenciador de pasos','Herramienta de acceso'],'Intimidante':['Armadura táctica','Insignia de rango','Máscara amenazante'],'Liderazgo':['Comunicador de escuadra','Proyector de mapas','Identificador de mando'],'Maestro Chasquilla':['Multiherramienta técnica','Escáner de circuitos','Kit de reparación'],'Observador':['Sensor óptico','Visor de largo alcance','Detector de movimiento'],'Peleador':['Guantes de impacto','Protector corporal','Refuerzo de nudillos'],'Persuasivo':['Identificación profesional','Traductor universal','Obsequio diplomático'],'Superviviente':['Filtro de aire','Ración compacta','Manta térmica'],'Tirador':['Rifle de precisión','Mira','Cargador adicional']},
    horror:{'Atlético':['Linterna frontal','Calzado resistente','Cuerda'],'Conocedor de...':['Archivo de recortes','Libro especializado','Grabadora de voz'],'Espadachín':['Espada antigua','Vaina','Piedra de afilar'],'Investigador':['Libreta de evidencias','Cámara','Lupa'],'Furtivo':['Ropa oscura','Guantes','Herramientas de apertura'],'Intimidante':['Vestimenta amenazante','Máscara inquietante','Objeto perturbador'],'Liderazgo':['Radio portátil','Plano del lugar','Silbato'],'Maestro Chasquilla':['Caja de herramientas','Alicates','Cinta aislante'],'Observador':['Linterna','Binoculares','Cámara compacta'],'Peleador':['Vendas','Guantes resistentes','Protección improvisada'],'Persuasivo':['Documentos de identidad','Grabadora','Objeto de confianza'],'Superviviente':['Botiquín','Agua embotellada','Manta'],'Tirador':['Arma a distancia apropiada','Linterna de montaje','Munición']},
    modern:{'Atlético':['Ropa deportiva','Zapatillas','Botella de agua'],'Conocedor de...':['Manual profesional','Computador portátil','Herramienta de medición'],'Espadachín':['Espada deportiva','Protección de entrenamiento','Bolso de transporte'],'Investigador':['Libreta','Grabadora','Cámara'],'Furtivo':['Ropa discreta','Guantes','Herramienta de apertura'],'Intimidante':['Vestimenta formal','Credencial de autoridad','Accesorio intimidante'],'Liderazgo':['Teléfono','Agenda de contactos','Presentación o plano'],'Maestro Chasquilla':['Caja de herramientas','Multímetro','Taladro'],'Observador':['Cámara','Binoculares','Linterna'],'Peleador':['Guantes de entrenamiento','Vendas','Protector bucal'],'Persuasivo':['Tarjetas de presentación','Teléfono','Obsequio de cortesía'],'Superviviente':['Botiquín','Botella de agua','Manta de emergencia'],'Tirador':['Equipo de tiro deportivo','Protección ocular','Protección auditiva']},
    postapoc:{'Atlético':['Botas resistentes','Cuerda','Mochila ligera'],'Conocedor de...':['Manual deteriorado','Cuaderno de apuntes','Herramienta especializada'],'Espadachín':['Machete','Piedra de afilar','Funda reforzada'],'Investigador':['Mapa usado','Libreta','Lupa improvisada'],'Furtivo':['Ropa de camuflaje','Máscara antipolvo','Herramienta de apertura'],'Intimidante':['Armadura improvisada','Trofeo amenazador','Emblema de banda'],'Liderazgo':['Radio reparada','Mapa de rutas','Silbato'],'Maestro Chasquilla':['Llave inglesa','Alicates','Piezas reutilizables'],'Observador':['Prismáticos','Espejo de señales','Linterna'],'Peleador':['Guantes reforzados','Vendas','Protección artesanal'],'Persuasivo':['Mercancía de trueque','Credencial antigua','Objeto de intercambio'],'Superviviente':['Cantimplora','Filtro de agua','Manta térmica'],'Tirador':['Arma a distancia apropiada','Mira artesanal','Munición']}
  };

  const APPROACH_DESCRIPTIONS: Record<string, { long: string; short: string }> = {
    Tenacidad: {
      long: 'Representa la resistencia física y mental, la determinación y la capacidad de soportar presión. Se utiliza para aguantar dolor, cansancio, privaciones o situaciones extremas, mantener el esfuerzo pese a las dificultades y no ceder ante amenazas, sufrimiento o adversidad.',
      short: 'Resistir, soportar presión y mantener la determinación.'
    },
    Disciplina: {
      long: 'Representa la capacidad de controlar conscientemente las propias emociones, impulsos y acciones. Se utiliza para mantener la compostura bajo presión, contener una reacción, sostener la concentración, seguir un plan y actuar con precisión sin dejarse dominar por el miedo, la ira o las distracciones.',
      short: 'Controlar las emociones, los impulsos y las propias acciones.'
    },
    Ingenio: {
      long: 'Representa la inteligencia práctica y la capacidad de comprender situaciones y encontrar soluciones. Se utiliza para deducir, investigar, recordar información útil, detectar patrones, relacionar indicios, improvisar estrategias y resolver problemas mediante el razonamiento.',
      short: 'Razonar, deducir y encontrar soluciones.'
    },
    Instinto: {
      long: 'Representa la capacidad de reaccionar de manera inmediata ante lo que sucede, guiándose por los reflejos y la percepción espontánea. Se utiliza para responder a peligros repentinos, esquivar, anticipar movimientos, actuar sin deliberar y aprovechar una oportunidad antes de que desaparezca.',
      short: 'Reaccionar de inmediato y actuar por reflejo.'
    }
  };
  const TRAIT_DESCRIPTIONS: Record<string, { long: string; short: string }> = {
    'Atlético': {
      long: 'Tienes una buena condición física y sabes aprovechar tu fuerza, resistencia y coordinación. Este Rasgo resulta útil al correr, saltar, trepar, nadar, mantener esfuerzos físicos prolongados o superar obstáculos que exigen preparación corporal.',
      short: 'Aprovechar tu condición física para superar desafíos corporales.'
    },
    'Conocedor de...': {
      long: 'Posees conocimientos y experiencia en un campo específico que defines al elegir el Rasgo. Puedes reconocer elementos propios de esa materia, comprender información especializada, recordar procedimientos y resolver problemas relacionados con ese ámbito.',
      short: 'Aplicar conocimientos y experiencia en el campo que definiste.'
    },
    'Espadachín': {
      long: 'Tienes entrenamiento y experiencia en el uso de espadas. Sabes manejar este tipo de arma, medir distancias, encontrar aperturas y aprovechar sus características en un enfrentamiento o en otras situaciones donde sea relevante tu dominio de la espada.',
      short: 'Usar espadas con técnica y experiencia.'
    },
    'Investigador': {
      long: 'Sabes buscar información, examinar indicios y reconstruir lo ocurrido a partir de pistas. Puedes interrogar, comparar testimonios, revisar documentos, relacionar detalles y seguir un método para descubrir respuestas que no son evidentes.',
      short: 'Buscar pistas, analizar indicios y reconstruir información.'
    },
    'Furtivo': {
      long: 'Sabes evitar llamar la atención y desplazarte sin ser detectado. Puedes ocultarte, moverte en silencio, aprovechar sombras y coberturas, infiltrarte o pasar inadvertido cuando la situación permite actuar con discreción.',
      short: 'Ocultarte, infiltrarte y actuar sin llamar la atención.'
    },
    'Intimidante': {
      long: 'Proyectas una presencia amenazante y sabes utilizarla para imponer respeto o temor. Puedes presionar a otros mediante tu actitud, reputación, aspecto o palabras, haciendo evidente que enfrentarte o contrariarte puede tener consecuencias.',
      short: 'Imponer temor o presión mediante tu presencia.'
    },
    'Liderazgo': {
      long: 'Sabes organizar, dirigir y coordinar a otras personas. Puedes transmitir instrucciones, mantener unido a un grupo, distribuir responsabilidades, tomar la iniciativa y orientar los esfuerzos colectivos hacia un objetivo común.',
      short: 'Dirigir, coordinar y mantener unido a un grupo.'
    },
    'Maestro Chasquilla': {
      long: 'Tienes habilidad práctica para reparar, adaptar, montar y construir cosas con los materiales y herramientas disponibles. Puedes improvisar arreglos, comprender mecanismos sencillos y encontrar soluciones manuales cuando no cuentas con el equipo ideal.',
      short: 'Reparar, adaptar e improvisar soluciones prácticas.'
    },
    'Observador': {
      long: 'Prestas atención a los detalles del entorno y sabes percibir aquello que otros pasan por alto. Puedes advertir movimientos, cambios, objetos fuera de lugar, señales sutiles o comportamientos extraños antes de que resulten evidentes.',
      short: 'Percibir detalles y notar cambios en el entorno.'
    },
    'Peleador': {
      long: 'Tienes experiencia enfrentándote físicamente a otras personas, especialmente en combate cuerpo a cuerpo. Sabes golpear, forcejear, derribar, defenderte y aprovechar tu cuerpo en una pelea sin depender necesariamente de armas.',
      short: 'Enfrentarte a otros cuerpo a cuerpo.'
    },
    'Persuasivo': {
      long: 'Sabes comunicarte para convencer, negociar y conseguir la cooperación de otras personas. Puedes argumentar, generar confianza, presentar propuestas de manera convincente y adaptar tu discurso a lo que le importa a tu interlocutor.',
      short: 'Convencer, negociar y conseguir la cooperación de otros.'
    },
    'Superviviente': {
      long: 'Sabes desenvolverte en entornos difíciles y cubrir necesidades básicas cuando faltan comodidades o recursos. Puedes orientarte, encontrar refugio, reconocer peligros naturales, conseguir recursos y tomar precauciones para mantenerte a salvo.',
      short: 'Orientarte y mantenerte a salvo en entornos difíciles.'
    },
    'Tirador': {
      long: 'Tienes práctica con armas a distancia y sabes apuntar, calcular trayectorias y elegir el momento adecuado para disparar o lanzar. Este Rasgo representa tu experiencia al atacar objetivos que se encuentran fuera del alcance cuerpo a cuerpo.',
      short: 'Apuntar y atacar con armas a distancia.'
    }
  };
  const EQUIPMENT: Record<string, string[]> = {
    'Atlético': ['Cuerda', 'Guantes de agarre', 'Botella de agua'],
    'Conocedor de...': ['Cuaderno de referencia', 'Instrumento de medición', 'Kit básico de trabajo'],
    'Espadachín': ['Espada', 'Escudo', 'Vaina'],
    'Furtivo': ['Capa con capucha', 'Ropa oscura', 'Herramientas de apertura sencillas'],
    'Intimidante': ['Vestimenta intimidante', 'Insignia o símbolo de autoridad', 'Accesorio amenazante'],
    'Maestro Chasquilla': ['Juego de herramientas manuales', 'Alicates', 'Cinta métrica'],
    'Observador': ['Lupa', 'Linterna', 'Espejo de inspección'],
    'Peleador': ['Guantes de combate', 'Vendas para las manos', 'Protector corporal ligero'],
    'Persuasivo': ['Vestimenta apropiada para negociar', 'Documento o credencial de presentación', 'Objeto de intercambio o cortesía'],
    'Tirador': ['Arco', 'Carcaj', 'Flechas'],
    'Investigador': ['Libreta de notas', 'Lápiz', 'Lupa'],
    'Liderazgo': ['Insignia de autoridad', 'Silbato', 'Mapa del grupo'],
    'Superviviente': ['Cantimplora', 'Pedernal y yesca', 'Manta de viaje']
  };

  type Item = { id: number; name: string; trait: string };
  type Character = {
    name: string; archetype: string; concept: string; age: string; appearance: string; experience: string; notes: string; portrait?: string;
    approaches: Record<string, number>; traits: string[]; inventory: Item[];
    will: number; maxWill: number; created: boolean;
  };
  const blankCharacter = (): Character => ({
    name: '', archetype: '', concept: '', age: '', appearance: '', experience: '', notes: '', portrait: '',
    approaches: { Tenacidad: 0, Disciplina: 0, Instinto: 0, Ingenio: 0 },
    traits: [], inventory: [], will: 4, maxWill: 4, created: false
  });

  function normalizeApproaches(value: any): Record<string, number> {
    const source = value && typeof value === 'object' ? value : {};
    return {
      Tenacidad: Number(source.Tenacidad) || 0,
      Disciplina: Number(source.Disciplina ?? source.Control) || 0,
      Instinto: Number(source.Instinto ?? source.Rapidez) || 0,
      Ingenio: Number(source.Ingenio ?? source.Astucia) || 0
    };
  }

  let character: Character = blankCharacter();
  let loaded = false;
  let step = 0;
  let nameStyle = 'fantasy';
  let nameGender = 'masculine';
  $: nameOptions = getNameOptions(nameStyle, nameGender);
  function generateRandomName() {
    const surnames = getSurnameOptions(nameStyle);
    if (!nameOptions.length || !surnames.length) return;
    const firstName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    character.name = `${firstName} ${surname}`;
    updateCharacter();
  }
  let conceptGenre = 'fantasy';
  $: conceptOptions = getConceptOptions(conceptGenre);
  let appearanceAge: AppearanceAge = 'young';
  let appearanceGender: AppearanceGender = 'male';
  function syncAppearanceAge() {
    character.age = APPEARANCE_AGES.find((age) => age.value === appearanceAge)?.label || '';
  }
  function generateRandomAppearance() {
    character.appearance = getRandomAppearance(appearanceAge, appearanceGender);
    updateCharacter();
  }
  function generateRandomConcept() {
    if (!conceptOptions.length) return;
    character.concept = conceptOptions[Math.floor(Math.random() * conceptOptions.length)];
  }
  let approachDraft: Record<string, number> = { Tenacidad: 0, Disciplina: 0, Instinto: 0, Ingenio: 0 };
  let traitDraft = '';
  let customTraitField = '';
  let equipmentDraft: string[] = [];
  let editingCharacter = false;
  let activeTab = 'personaje';
  let magicData: any = { players: {} };
  let playerMagicRecord: any = { spells: [] };
  let magicEffect = '';
  let magicPrice = '';
  let magicMagnitude: 'simple' | 'moderate' | 'extraordinary' = 'simple';
  let selectedMagicSpellId = '';
  let magicMessage = '';
  let gmTracker: any = { players: {}, conflict: { active: false, danger: 'Bajo', resistance: null } };
  let conflictActive = false;
  let conflictDanger = 'Bajo';
  let gmLoaded = false;
  type GmNpc = { genre: GmNpcGenre; name: string; appearance: string; personality: string };
  let gmNpcCharacters: GmNpc[] = [];
  let selectedGmNpcGenre: GmNpcGenre = 'fantasy';
  let gmNpcNotes = '';
  let selectedGenre = 'fantasy';
  let sessionStarted = false;
  let linesVeils: { lines: string; veils: string } = { lines: '', veils: '' };
  let visibleStates: string[] = [];
  let visibleEffortCoins = 3;
  let effortDiceBonus = 0;
  let selectedPlayerId = '';
  let selectedApproach = 'Tenacidad';
  let selectedTrait = '';
  let selectedState = '';
  let rollModifier = 'normal';
  let lastRoll: { dice: number[]; kept: number; pool: number; result: string; critical: boolean; notation?: string; summary?: string; approach?: string; retryNotation?: string; retryPool?: number } | null = null;
  let rollHistory: Array<{ id: string; timestamp: number; approach: string; dice: number[]; kept: number; result: string; critical: boolean; notation: string }> = [];
  let rollHistoryKey = '';
  let dicePlusError = '';
  let pendingDiceRoll: { rollId: string; pool: number; notation: string; approach: string; effortReroll: boolean; conflictActive: boolean; danger: string } | null = null;

  $: approachTotal = APPROACHES.reduce((sum, name) => sum + (Number(approachDraft[name]) || 0), 0);
  $: approachValid = approachTotal === 4 && APPROACHES.every(name => approachDraft[name] >= 0 && approachDraft[name] <= 2);
  $: myPlayer = $PartyStore.find(p => p.id === $currentPlayerId);
  // El rol llega de forma asíncrona desde Owlbear. Asegura una pestaña válida al cambiar de rol.
  $: if ($isGM && activeTab !== 'gm' && activeTab !== 'conflicto' && activeTab !== 'reglamento' && activeTab !== 'magia-gm' && activeTab !== 'lineas-velos' && activeTab !== 'pnj') activeTab = 'gm';
  $: if (!$isGM && (activeTab === 'gm' || activeTab === 'conflicto' || activeTab === 'magia-gm')) activeTab = 'personaje';
  $: partyMembers = $PartyStore.filter(p => p.role !== 'GM' && getPlayerCharacter(p)?.created === true);
  $: if ($isGM && partyMembers.length && !partyMembers.some(p => p.id === selectedPlayerId)) selectedPlayerId = partyMembers[0].id;
  $: selectedPlayer = partyMembers.find(p => p.id === selectedPlayerId);
  $: selectedCharacter = selectedPlayer?.metadata?.[DATA_KEY] as Character;
  $: createdCharacterCount = partyMembers.filter(p => getPlayerCharacter(p)?.created).length;
  $: initialConflictResistance = createdCharacterCount * 2;
  $: if ($isGM && gmTracker.conflict?.active && partyMembers.length > 0 && partyMembers.every((player) => (Number(getPlayerCharacter(player)?.will) || 0) <= 0)) resolveConflict('defeat');


  function traitLabel(trait: string, genre: string = selectedGenre): string {
    const base = trait.startsWith('Conocedor de ') ? 'Conocedor de...' : trait;
    const label = GENRE_TRAIT_LABELS[genre]?.[base] || base;
    return trait.startsWith('Conocedor de ') ? label.replace(/\.\.\.$/, '') + ' ' + trait.slice('Conocedor de '.length) : label;
  }
  function knowledgeOptions(genre: string = selectedGenre): string[] { return KNOWLEDGE_BY_GENRE[genre] || KNOWLEDGE_BY_GENRE.fantasy; }
  function equipmentForTrait(trait: string): string[] {
    const base = trait.startsWith('Conocedor de ') ? 'Conocedor de...' : trait;
    return GENRE_EQUIPMENT[selectedGenre]?.[base] || EQUIPMENT[base] || ['', '', ''];
  }
  // Presenta el mismo objeto de equipo con el nombre de la ambientación activa.
  // Los nombres personalizados no se alteran; solo se traducen los objetos sugeridos por el sistema.
  function equipmentDisplayName(item: Item, genre: string = selectedGenre): string {
    const base = item.trait.startsWith('Conocedor de ') ? 'Conocedor de...' : item.trait;
    const matchingSets = [EQUIPMENT[base] || [], ...Object.values(GENRE_EQUIPMENT).map((genre) => genre[base] || [])];
    for (const set of matchingSets) {
      const index = set.indexOf(item.name);
      if (index >= 0) return GENRE_EQUIPMENT[genre]?.[base]?.[index] || item.name;
    }
    return item.name;
  }
  async function changeGenre(genre: string) {
    if (!GENRES.some(item => item.id === genre)) return;
    selectedGenre = genre;
    try { if (OBR.isAvailable) await OBR.room.setMetadata({ [GENRE_KEY]: genre }); }
    catch (error) { console.error('No se pudo guardar la ambientación', error); }
  }

  async function startNewSession() {
    if (!$isGM || !OBR.isAvailable) return;
    if (!confirm('¿Estás seguro de que quieres iniciar una nueva sesión? Se restablecerán las monedas de esfuerzo de todos los jugadores a 3.')) return;
    try {
      const players = $PartyStore.filter(player => player.role !== 'GM');
      players.forEach(player => { playerTracker(player.id).effortCoins = 3; });
      saveGmTracker();
      await OBR.room.setMetadata({ [SESSION_KEY]: { active: true, startedAt: Date.now() } });
      sessionStarted = true;
    } catch (error) {
      console.error('No se pudo iniciar la sesión', error);
    }
  }

  function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
  function loadRollHistory() {
    if (!rollHistoryKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(rollHistoryKey) || '[]');
      rollHistory = Array.isArray(saved) ? saved.slice(0, 50) : [];
    } catch { rollHistory = []; }
  }
  function saveRollHistory() {
    if (!rollHistoryKey) return;
    try { localStorage.setItem(rollHistoryKey, JSON.stringify(rollHistory.slice(0, 50))); }
    catch (error) { console.error('No se pudo guardar el registro de tiradas', error); }
  }
  function recordRoll(roll: { approach: string; notation: string }, dice: number[], kept: number, result: string, critical: boolean) {
    const entry = {
      id: `roll_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(), approach: roll.approach, dice: [...dice], kept, result, critical, notation: roll.notation
    };
    rollHistory = [entry, ...rollHistory].slice(0, 50);
    saveRollHistory();
  }
  function clearRollHistory() {
    if (!rollHistory.length) return;
    if (!window.confirm('¿Borrar todo el registro de tiradas?')) return;
    rollHistory = [];
    saveRollHistory();
  }
  function resultDescription(result: string) {
    if (result === 'Éxito con consecuencia') return 'Tienes éxito en lo que intentaste, pero algo empeora o surge una complicación.';
    if (result === 'Éxito limpio' || result === 'Éxito crítico') return 'Consigues lo que intentaste sin sufrir una consecuencia adicional.';
    if (result === 'Fracaso') return 'No consigues lo que intentaste y la situación puede empeorar.';
    return '';
  }
  function getStoredCharacter(): Character {
    try {
      const raw = localStorage.getItem('mimprov-character-v1');
      if (!raw) return blankCharacter();
      const saved = JSON.parse(raw);
      return { ...blankCharacter(), ...saved, approaches: normalizeApproaches(saved.approaches) };
    } catch { return blankCharacter(); }
  }
  function saveLocalCharacter() {
    localStorage.setItem('mimprov-character-v1', JSON.stringify(character));
  }
  let saveTimer: any;
  function publishCharacter() {
    saveLocalCharacter();
    if (!OBR.isAvailable || !loaded || !$currentPlayerId || $isGM) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try { await OBR.player.setMetadata({ [DATA_KEY]: clone(character) }); }
      catch (error) { console.error('No se pudo sincronizar la ficha MIMPROV', error); }
    }, 180);
  }
  function updateCharacter() { character = clone(character); publishCharacter(); }

  async function uploadCharacterPortrait(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (!file.type.startsWith('image/')) throw new Error('Selecciona un archivo de imagen.');
      const sourceUrl = URL.createObjectURL(file);
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        image.src = sourceUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No se pudo procesar la imagen.');
      const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
      const sx = (image.naturalWidth - cropSize) / 2;
      const sy = (image.naturalHeight - cropSize) / 2;
      context.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, 512, 512);
      character.portrait = canvas.toDataURL('image/webp', 0.86);
      URL.revokeObjectURL(sourceUrl);
      updateCharacter();
    } catch (error) {
      console.error('No se pudo cargar el retrato del personaje', error);
      alert(error instanceof Error ? error.message : 'No se pudo procesar la imagen.');
    } finally {
      input.value = '';
    }
  }

  function removeCharacterPortrait() {
    character.portrait = '';
    updateCharacter();
  }

  function addCatalogSpell(spell: typeof MAGIC_CATALOG[number]) {
    const spells = [...(playerMagicRecord?.spells || [])];
    if (spells.some((item: any) => item.id === spell.id)) { magicMessage = 'Este conjuro ya está en tu lista.'; return; }
    spells.push({ ...spell, price: '', status: 'accepted', source: 'catalog' });
    playerMagicRecord = { ...playerMagicRecord, spells };
    if (OBR.isAvailable) OBR.player.setMetadata({ [PLAYER_MAGIC_KEY]: playerMagicRecord }).catch((error) => console.error('No se pudo guardar el conjuro', error));
    magicMessage = 'Conjuro añadido a tu personaje.';
  }
  function removeCatalogSpell(spellId: string) {
    playerMagicRecord = { ...playerMagicRecord, spells: (playerMagicRecord?.spells || []).filter((spell: any) => !(spell.id === spellId && spell.source === 'catalog')) };
    if (selectedMagicSpellId === spellId) selectedMagicSpellId = '';
    if (OBR.isAvailable) OBR.player.setMetadata({ [PLAYER_MAGIC_KEY]: playerMagicRecord }).catch((error) => console.error('No se pudo actualizar la lista de conjuros', error));
  }
  function magicMagnitudeLabel(magnitude: string | undefined) {
    if (magnitude === 'moderate') return 'Magia moderada (+1 éxito adicional)';
    if (magnitude === 'extraordinary') return 'Magia extraordinaria (+2 éxitos adicionales)';
    return 'Truco simple (sin éxitos adicionales)';
  }
  function getMyMagicRecord() {
    return {
      proposals: magicData?.players?.[$currentPlayerId]?.proposals || [],
      spells: playerMagicRecord?.spells || []
    };
  }
  async function submitMagicPact() {
    const effect = magicEffect.trim();
    const price = magicPrice.trim();
    if (!effect || !price) { magicMessage = 'Completa ambos campos antes de firmar el pacto.'; return; }
    if (!OBR.isAvailable || !$currentPlayerId || $isGM) { magicMessage = 'Debes estar dentro de una sala de Owlbear Rodeo como jugador para enviar el pacto.'; return; }
    const pact = { id: 'pact_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), effect, price, magnitude: magicMagnitude, status: 'pending', createdAt: Date.now() };
    try {
      await OBR.broadcast.sendMessage(MAGIC_SUBMIT_CHANNEL, { playerId: $currentPlayerId, playerName: myPlayer?.name || character.name || 'Jugador', pact }, { destination: 'ALL' });
      magicEffect = ''; magicPrice = ''; magicMagnitude = 'simple'; magicMessage = 'Pacto firmado y enviado al GM para su revisión.';
    } catch (error) { console.error('No se pudo enviar el pacto mágico', error); magicMessage = 'No se pudo enviar el pacto. Comprueba tu conexión con Owlbear Rodeo.'; }
  }
  async function updateMagicPact(playerId: string, pactId: string, decision: 'accepted' | 'rejected') {
    if (!$isGM || !OBR.isAvailable) return;
    const next = clone(magicData || { players: {} }); if (!next.players) next.players = {};
    const record = next.players[playerId] || { proposals: [] };
    const pact = (record.proposals || []).find((item) => item.id === pactId);
    if (!pact || pact.status !== 'pending') return;
    if (decision === 'accepted') {
      try {
        await OBR.broadcast.sendMessage(MAGIC_APPROVED_CHANNEL, {
          playerId, pact: { ...pact, status: 'accepted', reviewedAt: Date.now() }
        }, { destination: 'ALL' });
      } catch (error) {
        console.error('No se pudo entregar el conjuro aprobado al jugador', error);
        return;
      }
    }
    record.proposals = (record.proposals || []).filter((item) => item.id !== pactId);
    if (record.proposals.length) next.players[playerId] = record;
    else delete next.players[playerId];
    try { await OBR.room.setMetadata({ [MAGIC_KEY]: next }); magicData = next; }
    catch (error) { console.error('No se pudo retirar la propuesta revisada', error); }
  }

  function exportCharacter() {
    const data = JSON.stringify({ format: 'MIMPROV-character', version: 1, character }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (character.name || 'personaje-mimprov').trim().replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() + '.json';
    link.click();
    URL.revokeObjectURL(url);
  }
  async function importCharacter(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = parsed?.format === 'MIMPROV-character' ? parsed.character : parsed;
      if (!incoming || typeof incoming !== 'object' || !incoming.approaches || !Array.isArray(incoming.traits) || !Array.isArray(incoming.inventory)) {
        throw new Error('El archivo no contiene una ficha MIMPROV válida.');
      }
      character = { ...blankCharacter(), ...incoming, approaches: normalizeApproaches(incoming.approaches), created: true };
      updateCharacter();
      editingCharacter = false;
      step = 0;
    } catch (error) {
      console.error('No se pudo importar la ficha MIMPROV', error);
      alert('No se pudo importar el archivo. Selecciona una exportación JSON de MIMPROV.');
    } finally {
      input.value = '';
    }
  }
  $: selectedMagicSpell = (playerMagicRecord?.spells || []).find((spell: any) => spell.id === selectedMagicSpellId);
  $: selectedMagicSpellBonus = selectedMagicSpell?.magnitude === 'moderate' ? 1 : selectedMagicSpell?.magnitude === 'extraordinary' ? 2 : 0;
  $: selectedApproachScore = Number(character.approaches?.[selectedApproach] || 0);
  $: selectedTraitBonus = selectedTrait && character.traits.includes(selectedTrait) ? 1 : 0;
  $: selectedState = visibleStates.find((stateName) => {
    const state = STATES.find((item) => item.name === stateName);
    return !!state && (state.enfoque === selectedApproach || state.enfoque === 'Todos');
  }) || '';
  $: selectedStatePenalty = selectedState ? 1 : 0;
  $: displayedStates = [...visibleStates.filter((stateName) => stateName !== 'Incapacitado' && stateName !== 'Abrumado'), ...(Number(character.will) <= 0 ? ['Abrumado'] : [])];
  $: characterApproachTotal = APPROACHES.reduce((sum, name) => sum + (Number(character.approaches?.[name]) || 0), 0);
  $: characterApproachesValid = characterApproachTotal === 4 && APPROACHES.every(name => Number(character.approaches?.[name]) >= 0 && Number(character.approaches?.[name]) <= 2);
  $: inventoryValid = character.traits.length === 4 && character.traits.every(trait => {
    const items = character.inventory.filter(item => item.trait === trait);
    return items.length === 3 && items.every(item => typeof item.name === 'string' && item.name.trim().length > 0);
  }) && character.inventory.filter(item => item.trait === 'Personal').every(item => typeof item.name === 'string' && item.name.trim().length > 0);
  $: baseDicePool = selectedApproachScore + selectedTraitBonus - selectedStatePenalty;
  $: dicePool = baseDicePool + effortDiceBonus + (rollModifier === 'advantage' ? 1 : rollModifier === 'disadvantage' ? -1 : 0);
  $: forcedLowRoll = Number(character.will) <= 0;
  $: diceNotation = forcedLowRoll || dicePool <= 0 ? '2d6kl1' : `${dicePool}d6kh1`;

  async function checkDicePlusReady(): Promise<boolean> {
    const requestId = `mimprov_ready_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return new Promise((resolve) => {
      const unsubscribe = OBR.broadcast.onMessage('dice-plus/isReady', (event) => {
        const data = event.data as any;
        if (data?.ready === true && data.requestId === requestId) {
          unsubscribe();
          resolve(true);
        }
      });
      OBR.broadcast.sendMessage('dice-plus/isReady', { requestId, timestamp: Date.now() }, { destination: 'ALL' })
        .catch(() => { unsubscribe(); resolve(false); });
      setTimeout(() => { unsubscribe(); resolve(false); }, 1500);
    });
  }

  async function sendDiceRoll(notation: string, pool: number, approach: string, effortReroll = false, retryNotation = notation, retryPool = pool) {
    if (!OBR.isAvailable || !loaded || pendingDiceRoll) return;
    dicePlusError = '';
    try {
      const rollId = `mimprov_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      pendingDiceRoll = {
        rollId, pool, notation, approach, effortReroll, retryNotation, retryPool,
        conflictActive, danger: conflictDanger
      };
      lastRoll = { dice: [], kept: 0, pool, result: effortReroll ? 'Repitiendo todos los dados…' : 'Tirando en Dice+…', critical: false, notation };
      await OBR.broadcast.sendMessage('dice-plus/roll-request', {
        rollId,
        playerId: await OBR.player.getId(),
        playerName: await OBR.player.getName(),
        rollTarget: 'everyone',
        diceNotation: notation + ' # MIMPROV',
        showResults: true,
        timestamp: Date.now(),
        source: DICE_PLUS_SOURCE
      }, { destination: 'ALL' });
      setTimeout(() => {
        if (pendingDiceRoll?.rollId === rollId) {
          pendingDiceRoll = null;
          dicePlusError = 'Dice+ no respondió a la tirada. Comprueba que esté instalado y activo en esta sala.';
        }
      }, 12000);
    } catch (error) {
      console.error('No se pudo enviar la tirada a Dice+', error);
      pendingDiceRoll = null;
      const detail = error instanceof Error
        ? `${error.name}: ${error.message}`
        : (() => { try { return JSON.stringify(error); } catch { return String(error ?? 'Error desconocido'); } })();
      dicePlusError = `[MIMPROV 1.3.7] Error al enviar la solicitud a Dice+: ${detail || 'sin detalle'}.`;
    }
  }

  async function rollDice() {
    if (!OBR.isAvailable || !loaded) {
      dicePlusError = 'Esta tirada necesita Owlbear Rodeo y la extensión Dice+.';
      return;
    }
    if (pendingDiceRoll) return;
    const spellCost = Number(selectedMagicSpell?.willCost || 0);
    if (selectedMagicSpell && spellCost > Number(character.will || 0)) {
      dicePlusError = `No tienes suficiente Voluntad para lanzar ${selectedMagicSpell.name || 'este conjuro'} (necesitas ${spellCost}).`;
      return;
    }
    if (selectedMagicSpell && spellCost > 0) {
      character.will = Math.max(0, Number(character.will || 0) - spellCost);
      updateCharacter();
      dicePlusError = `Has gastado ${spellCost} Voluntad para lanzar ${selectedMagicSpell.name || 'el conjuro'}.`;
    }
    const retryPool = selectedApproachScore + selectedTraitBonus + effortDiceBonus + (rollModifier === 'advantage' ? 1 : 0);
    const retryNotation = forcedLowRoll ? '2d6kl1' : retryPool <= 0 ? '2d6kl1' : `${retryPool}d6kh1`;
    await sendDiceRoll(diceNotation, dicePool, selectedApproach, false, retryNotation, retryPool);
    effortDiceBonus = 0;
  }

  async function spendEffort(mode: 'extra-die' | 'reroll') {
    if (visibleEffortCoins <= 0 || pendingDiceRoll) return false;
    if (mode === 'reroll' && (!lastRoll || !lastRoll.retryNotation || !Number.isFinite(lastRoll.retryPool))) return false;
    try {
      await OBR.broadcast.sendMessage(EFFORT_REQUEST_CHANNEL, {
        playerId: await OBR.player.getId(), mode, requestedAt: Date.now()
      }, { destination: 'ALL' });
      visibleEffortCoins = Math.max(0, visibleEffortCoins - 1);
      if (mode === 'extra-die') {
        effortDiceBonus = 1;
        dicePlusError = 'Moneda aplicada: +1d6 a la próxima tirada.';
      } else if (lastRoll) {
        dicePlusError = '';
        await sendDiceRoll(lastRoll.retryNotation!, lastRoll.retryPool!, lastRoll.approach || selectedApproach, true, lastRoll.retryNotation!, lastRoll.retryPool!);
      }
      return true;
    } catch (error) {
      console.error('No se pudo solicitar el gasto de una moneda de esfuerzo', error);
      dicePlusError = 'No se pudo registrar la moneda de esfuerzo con el narrador.';
      return false;
    }
  }

  function applyConflictFailure(active: boolean, danger: string) {
    if (!active) return;
    const willLoss: Record<string, number> = { Bajo: 1, Medio: 2, Alto: 3 };
    const loss = willLoss[danger] ?? 1;
    adjustWill(-loss);
  }

  function handleDicePlusResult(event: any) {
    const data = event.data as any;
    if (!pendingDiceRoll || data?.rollId !== pendingDiceRoll.rollId || !data.result) return;
    const roll = { ...pendingDiceRoll };
    const dice = (data.result.groups || []).flatMap((group: any) =>
      (group.dice || []).map((die: any) => Number(die.value)).filter((value: number) => Number.isFinite(value))
    );
    const keptDice = (data.result.groups || []).flatMap((group: any) =>
      (group.dice || []).filter((die: any) => die.kept !== false).map((die: any) => Number(die.value)).filter((value: number) => Number.isFinite(value))
    );
    const kept = keptDice.length ? (roll.notation.includes('kl1') ? Math.min(...keptDice) : Math.max(...keptDice)) : Number(data.result.totalValue);
    const critical = dice.filter((value: number) => value === 6).length >= 2;
    const failed = kept <= 4;
    const result = failed ? 'Fracaso' : kept === 5 ? 'Éxito con consecuencia' : 'Éxito limpio';
    const finalResult = critical ? 'Éxito crítico' : result;
    lastRoll = {
      dice, kept, pool: roll.pool,
      result: finalResult,
      critical, notation: roll.notation, summary: data.result.rollSummary, approach: roll.approach,
      retryNotation: roll.retryNotation, retryPool: roll.retryPool
    };
    recordRoll(roll, dice, kept, finalResult, critical);
    pendingDiceRoll = null;
    if (critical) {
      adjustWill(1);
      return;
    }
    if (!failed) return;
    applyConflictFailure(roll.conflictActive, roll.danger);
  }

  function handleDicePlusError(event: any) {
    const data = event.data as any;
    if (!pendingDiceRoll || data?.rollId !== pendingDiceRoll.rollId) return;
    dicePlusError = `Dice+ no pudo realizar la tirada: ${data.error || 'error desconocido'}`;
    pendingDiceRoll = null;
  }

  onMount(() => {
    character = getStoredCharacter();
    if (OBR.isAvailable) {
      OBR.onReady(async () => {
        try {
          const role = await OBR.player.getRole();
          const roomId = OBR.room.id || 'default';
          const playerId = await OBR.player.getId();
          rollHistoryKey = `mimprov-roll-history-v1-${roomId}-${playerId}`;
          loadRollHistory();
          const syncLinesVeils = (metadata: any) => {
            const shared = metadata?.[LINES_VEILS_KEY] || { lines: '', veils: '' };
            linesVeils = { lines: String(shared.lines || ''), veils: String(shared.veils || '') };
            const room = OBR.room.id;
            localStorage.setItem('mimprov-lines-veils-v1-' + room, JSON.stringify(linesVeils));
          };
          const syncGenre = (metadata: any) => { const genre = metadata?.[GENRE_KEY]; selectedGenre = GENRES.some(item => item.id === genre) ? genre : 'fantasy'; };
          syncGenre(await OBR.room.getMetadata());
          OBR.room.onMetadataChange(syncGenre);
          const syncSession = (metadata: any) => { sessionStarted = metadata?.[SESSION_KEY]?.active === true; };
          syncSession(await OBR.room.getMetadata());
          OBR.room.onMetadataChange(syncSession);
          syncLinesVeils(await OBR.room.getMetadata());
          OBR.room.onMetadataChange(syncLinesVeils);
          OBR.broadcast.onMessage(LINES_VEILS_REQUEST_CHANNEL, async (event) => {
            if (role !== 'GM') return;
            const data = event.data as any;
            if (!data || !['lines', 'veils'].includes(data.field) || typeof data.value !== 'string') return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || (sender.role !== 'PLAYER' && sender.role !== 'GM')) return;
              const current = (await OBR.room.getMetadata())?.[LINES_VEILS_KEY] || { lines: '', veils: '' };
              await OBR.room.setMetadata({ [LINES_VEILS_KEY]: { ...current, [data.field]: data.value.slice(0, 20000) } });
            } catch (error) {
              console.error('No se pudieron sincronizar las líneas y velos', error);
            }
          });
          if (role === 'PLAYER') {
            const metadata = await OBR.player.getMetadata();
            if (metadata[DATA_KEY]) {
              const incoming = metadata[DATA_KEY] as Character;
              character = { ...blankCharacter(), ...incoming, approaches: normalizeApproaches(incoming.approaches) };
              saveLocalCharacter();
            } else if (character.created) {
              await OBR.player.setMetadata({ [DATA_KEY]: clone(character) });
            }
          }
          if (role === 'PLAYER') {
            playerMagicRecord = (await OBR.player.getMetadata())?.[PLAYER_MAGIC_KEY] || { spells: [] };
            const syncStates = (metadata: any) => {
              const allStates = metadata?.[STATE_KEY] || {};
              visibleStates = Array.isArray(allStates[$currentPlayerId]) ? allStates[$currentPlayerId].filter((stateName: string) => stateName !== 'Incapacitado' && stateName !== 'Abrumado') : [];
              const allOverexertion = metadata?.[OVEREXERTION_KEY] || {};
              visibleEffortCoins = Math.max(0, Math.min(3, Number(allOverexertion[$currentPlayerId] ?? 3) || 0));
              const conflict = metadata?.[CONFLICT_KEY] || {};
              conflictActive = conflict.active === true;
              conflictDanger = ['Bajo', 'Medio', 'Alto'].includes(conflict.danger) ? conflict.danger : 'Bajo';
            };
            syncStates(await OBR.room.getMetadata());
            OBR.room.onMetadataChange(syncStates);
          }
          OBR.broadcast.onMessage(EFFORT_REQUEST_CHANNEL, async (event) => {
            if (role !== 'GM') return;
            const data = event.data as any;
            if (!data?.playerId || !['extra-die', 'reroll'].includes(data.mode)) return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || sender.role !== 'PLAYER' || sender.id !== data.playerId) return;
              const tracker = playerTracker(sender.id);
              if (Number(tracker.effortCoins ?? (3 - (Number(tracker.overexertionUsed) || 0))) <= 0) return;
              tracker.effortCoins = Math.max(0, Number(tracker.effortCoins ?? (3 - (Number(tracker.overexertionUsed) || 0))) - 1);
              saveGmTracker();
            } catch (error) {
              console.error('No se pudo registrar la moneda de esfuerzo', error);
            }
          });
          OBR.broadcast.onMessage(MAGIC_SUBMIT_CHANNEL, async (event) => {
            if (role !== 'GM') return;
            const data = event.data as any;
            if (!data?.playerId || !data?.pact?.id || !data.pact.effect?.trim() || !data.pact.price?.trim()) return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || sender.role !== 'PLAYER' || sender.id !== data.playerId) return;
              const current = (await OBR.room.getMetadata())?.[MAGIC_KEY] || { players: {} };
              const next = clone(current); if (!next.players) next.players = {};
              const record = next.players[sender.id] || { proposals: [], spells: [] };
              record.proposals = Array.isArray(record.proposals) ? record.proposals : [];
              if (record.proposals.some((item) => item.id === data.pact.id)) return;
              record.proposals = [...record.proposals, { id: String(data.pact.id), effect: String(data.pact.effect).trim(), price: String(data.pact.price).trim(), status: 'pending', createdAt: Number(data.pact.createdAt) || Date.now(), playerName: sender.name || data.playerName || 'Jugador' }];
              next.players[sender.id] = record; await OBR.room.setMetadata({ [MAGIC_KEY]: next }); magicData = next;
            } catch (error) { console.error('No se pudo registrar la propuesta de pacto', error); }
          });
          OBR.broadcast.onMessage(MAGIC_APPROVED_CHANNEL, async (event) => {
            const data = event.data as any;
            if (role !== 'PLAYER' || data?.playerId !== $currentPlayerId || !data?.pact?.id) return;
            const spells = Array.isArray(playerMagicRecord?.spells) ? [...playerMagicRecord.spells] : [];
            if (!spells.some((item) => item.id === data.pact.id)) spells.push(data.pact);
            playerMagicRecord = { spells };
            try { await OBR.player.setMetadata({ [PLAYER_MAGIC_KEY]: playerMagicRecord }); }
            catch (error) { console.error('No se pudo guardar el conjuro en la ficha del jugador', error); }
          });
          OBR.room.onMetadataChange((metadata) => { magicData = metadata?.[MAGIC_KEY] || { players: {} }; });
          OBR.room.getMetadata().then((metadata) => { magicData = metadata?.[MAGIC_KEY] || { players: {} }; }).catch((error) => console.error('No se pudieron cargar los pactos mágicos', error));
          OBR.broadcast.onMessage(REST_REQUEST_CHANNEL, async (event) => {
            if (role !== 'GM') return;
            const data = event.data as any;
            if (!data?.playerId) return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || sender.role !== 'PLAYER' || sender.id !== data.playerId) return;
              // El descanso recupera Voluntad, pero no repone monedas de esfuerzo.
              saveGmTracker();
            } catch (error) {
              console.error('No se pudo registrar el descanso', error);
            }
          });
          OBR.broadcast.onMessage(DELETE_CHARACTER_CHANNEL, async (event) => {
            const data = event.data as any;
            if (!data) return;
            if (role === 'GM' && data.action === 'PLAYER_DELETE_REQUEST' && data.playerId) {
              try {
                const party = await OBR.party.getPlayers();
                const sender = party.find((p: any) => p.connectionId === event.connectionId);
                if (sender && sender.role === 'PLAYER' && sender.id === data.playerId) {
                  await deletePlayerCharacter(sender, true);
                }
              } catch (error) {
                console.error('No se pudo procesar la solicitud de eliminación', error);
              }
              return;
            }
            if (data.action !== 'DELETE_CHARACTER' || data.playerId !== $currentPlayerId) return;
            try {
              const party = await OBR.party.getPlayers();
              const sender = party.find((p: any) => p.connectionId === event.connectionId);
              if (!sender || sender.role !== 'GM') return;
              character = blankCharacter();
              editingCharacter = false;
              step = 0;
              localStorage.removeItem('mimprov-character-v1');
              await OBR.player.setMetadata({ [DATA_KEY]: clone(character), [PLAYER_MAGIC_KEY]: { spells: [] } });
              playerMagicRecord = { spells: [] };
              magicData = { ...magicData, players: { ...(magicData.players || {}) } };
              delete magicData.players[$currentPlayerId];
            } catch (error) {
              console.error('No se pudo borrar la ficha del personaje', error);
            }
          });
                    OBR.broadcast.onMessage(`${DICE_PLUS_SOURCE}/roll-result`, handleDicePlusResult);
          OBR.broadcast.onMessage(`${DICE_PLUS_SOURCE}/roll-error`, handleDicePlusError);
          loaded = true;
        } catch (error) {
          console.error('Error al cargar la ficha MIMPROV', error);
          loaded = true;
        }
      });
    } else {
      loaded = true;
    }
    if (OBR.isAvailable) {
      OBR.onReady(() => { loadGmTracker(); gmLoaded = true; });
    } else {
      loadGmTracker(); gmLoaded = true;
    }
  });

  function createGmNpc(genre: GmNpcGenre): GmNpc {
    const genreConfig = GM_NPC_GENRES.find((item) => item.id === genre) || GM_NPC_GENRES[0];
    const gender = Math.random() < 0.5 ? 'masculine' : 'feminine';
    const appearanceGender: AppearanceGender = gender === 'feminine' ? 'female' : 'male';
    const age = APPEARANCE_AGES[Math.floor(Math.random() * APPEARANCE_AGES.length)].value;
    const firstNames = getNameOptions(genreConfig.nameStyle, gender);
    const surnames = getSurnameOptions(genreConfig.nameStyle);
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)] || 'Alex';
    const surname = surnames[Math.floor(Math.random() * surnames.length)] || 'Silva';
    return {
      genre,
      name: `${firstName} ${surname}`,
      appearance: getRandomAppearance(age, appearanceGender),
      personality: getRandomGmNpcPersonality(genre)
    };
  }

  function updateLinesVeils(field: 'lines' | 'veils', value: string) {
    linesVeils = { ...linesVeils, [field]: value };
    if (!OBR.isAvailable) {
      localStorage.setItem('mimprov-lines-veils-local', JSON.stringify(linesVeils));
      return;
    }
    if ($isGM) {
      OBR.room.setMetadata({ [LINES_VEILS_KEY]: { ...linesVeils } }).catch((error) => console.error('No se pudieron guardar las líneas y velos', error));
    } else {
      OBR.broadcast.sendMessage(LINES_VEILS_REQUEST_CHANNEL, { field, value }).catch((error) => console.error('No se pudo enviar el cambio de líneas y velos', error));
    }
  }

  function loadGmNpcNotes() {
    const room = OBR.isAvailable ? OBR.room.id : 'local';
    gmNpcNotes = localStorage.getItem('mimprov-gm-npc-notes-v1-' + room) || '';
  }

  function saveGmNpcNotes() {
    const room = OBR.isAvailable ? OBR.room.id : 'local';
    localStorage.setItem('mimprov-gm-npc-notes-v1-' + room, gmNpcNotes);
  }

  function saveGmNpcCharacters() {
    const room = OBR.isAvailable ? OBR.room.id : 'local';
    localStorage.setItem('mimprov-gm-npcs-v1-' + room, JSON.stringify(gmNpcCharacters));
    localStorage.setItem('mimprov-gm-npc-genre-v1-' + room, selectedGmNpcGenre);
  }

  function loadGmNpcCharacters() {
    const room = OBR.isAvailable ? OBR.room.id : 'local';
    const key = 'mimprov-gm-npcs-v1-' + room;
    try {
      const savedGenre = localStorage.getItem('mimprov-gm-npc-genre-v1-' + room) as GmNpcGenre | null;
      selectedGmNpcGenre = GM_NPC_GENRES.some((genre) => genre.id === savedGenre) ? savedGenre! : 'fantasy';
      const raw = localStorage.getItem(key);
      const stored = raw ? JSON.parse(raw) : [];
      const valid = Array.isArray(stored) && stored.length === 5 && stored.every((npc: any) =>
        npc?.genre === selectedGmNpcGenre && npc.name && npc.appearance && npc.personality
      );
      gmNpcCharacters = valid
        ? stored
        : Array.from({ length: 5 }, () => createGmNpc(selectedGmNpcGenre));
    } catch {
      selectedGmNpcGenre = 'fantasy';
      gmNpcCharacters = Array.from({ length: 5 }, () => createGmNpc(selectedGmNpcGenre));
    }
    saveGmNpcCharacters();
  }

  function changeGmNpcGenre() {
    gmNpcCharacters = Array.from({ length: 5 }, () => createGmNpc(selectedGmNpcGenre));
    saveGmNpcCharacters();
  }

  function rerollGmNpc(index: number) {
    gmNpcCharacters = gmNpcCharacters.map((npc, i) => i === index ? createGmNpc(selectedGmNpcGenre) : npc);
    saveGmNpcCharacters();
  }

  function loadGmTracker() {
    loadGmNpcCharacters();
    loadGmNpcNotes();
    try {
      const room = OBR.isAvailable ? OBR.room.id : 'local';
      const raw = localStorage.getItem('mimprov-gm-v1-' + room);
      gmTracker = raw ? JSON.parse(raw) : { players: {}, conflict: { danger: 'Bajo', resistance: null } };
      if (!gmTracker || typeof gmTracker !== 'object') gmTracker = { players: {}, conflict: { danger: 'Bajo', resistance: null } };
      if (!gmTracker.players || typeof gmTracker.players !== 'object') gmTracker.players = {};
      if (!gmTracker.conflict || typeof gmTracker.conflict !== 'object') gmTracker.conflict = { active: false, danger: 'Bajo', resistance: null };
      if (typeof gmTracker.conflict.active !== 'boolean') gmTracker.conflict.active = false;
      if (!['Bajo', 'Medio', 'Alto'].includes(gmTracker.conflict.danger)) gmTracker.conflict.danger = 'Bajo';
      if (gmTracker.conflict.resistance !== null && !Number.isFinite(Number(gmTracker.conflict.resistance))) gmTracker.conflict.resistance = null;
    } catch { gmTracker = { players: {}, conflict: { active: false, danger: 'Bajo', resistance: null } }; }
    conflictActive = gmTracker.conflict.active === true;
    conflictDanger = gmTracker.conflict.danger || 'Bajo';
    saveGmTracker();
  }
  function saveGmTracker() {
    const room = OBR.isAvailable ? OBR.room.id : 'local';
    localStorage.setItem('mimprov-gm-v1-' + room, JSON.stringify(gmTracker));
    gmTracker = clone(gmTracker);
    if (OBR.isAvailable && $isGM) {
      const allStates: Record<string, string[]> = {};
      const allOverexertion: Record<string, number> = {};
      Object.entries(gmTracker.players || {}).forEach(([id, tracker]: [string, any]) => {
        allStates[id] = Array.isArray(tracker.states) ? [...tracker.states] : [];
        allOverexertion[id] = Math.max(0, Math.min(3, Number(tracker.effortCoins ?? (3 - (Number(tracker.overexertionUsed) || 0))) || 0));
      });
      OBR.room.setMetadata({ [STATE_KEY]: allStates, [OVEREXERTION_KEY]: allOverexertion, [CONFLICT_KEY]: clone(gmTracker.conflict) }).catch((error) => {
        console.error('No se pudieron publicar los datos de seguimiento de los personajes', error);
      });
    }
  }
  function playerTracker(id: string) {
    if (!gmTracker.players[id]) gmTracker.players[id] = { states: [], risk: 'Ninguno', effortCoins: 3 };
    const tracker = gmTracker.players[id];
    if (!Number.isFinite(Number(tracker.effortCoins))) tracker.effortCoins = Math.max(0, 3 - (Number(tracker.overexertionUsed) || 0));
    tracker.effortCoins = Math.max(0, Math.min(3, Number(tracker.effortCoins)));
    return gmTracker.players[id];
  }
  function getPlayerCharacter(player: any): Character | undefined {
    const stored = player?.metadata?.[DATA_KEY] as Character | undefined;
    return stored ? { ...stored, approaches: normalizeApproaches(stored.approaches) } : undefined;
  }

  function startCreation() { step = 0; character = blankCharacter(); approachDraft = { Tenacidad: 0, Disciplina: 0, Instinto: 0, Ingenio: 0 }; }
  function isFixedArchetypeTrait(trait: string): boolean {
    return (ARCHETYPES[character.archetype]?.traits || []).some((fixed) => fixed === trait || (fixed === 'Conocedor de...' && trait.startsWith('Conocedor de ')));
  }
  function updateArchetypeKnowledge(value: string) {
    const index = character.traits.findIndex((trait) => trait === 'Conocedor de...' || trait.startsWith('Conocedor de '));
    if (index < 0) return;
    const previous = character.traits[index];
    const next = value.trim() ? 'Conocedor de ' + value.trim() : 'Conocedor de...';
    character.traits[index] = next;
    character.inventory = character.inventory.map((item) => item.trait === previous ? { ...item, trait: next } : item);
    updateCharacter();
  }
  function selectArchetype(name: string) {
    const archetype = ARCHETYPES[name];
    if (!archetype) return;
    character.archetype = name;
    customTraitField = '';
    character.approaches = { ...archetype.approaches };
    approachDraft = { ...archetype.approaches };
    character.traits = [...archetype.traits];
    character.inventory = [];
    character.traits.forEach((trait) => {
      const equipment = equipmentForTrait(trait);
      equipment.forEach((item, i) => character.inventory.push({ id: Date.now() + i + character.inventory.length, name: item, trait }));
    });
    updateCharacter();
  }
  function nextStep() {
    if (step === 1 && !character.archetype) return;
    if (step === 2 && !character.concept.trim()) return;
    if (step === 5 && !approachValid) return;
    if (step === 6 && character.traits.length !== 4) return;
    if (step === 7 && !inventoryValid) return;
    if (step === 5) character.approaches = { ...approachDraft };
    if (step < 8) step += 1;
    else { character.created = true; character.will = 4; character.maxWill = 4; updateCharacter(); editingCharacter = false; }
  }
  function previousStep() { if (step > 0) step -= 1; }
  function setApproach(name: string, value: number) {
    const fixedValue = ARCHETYPES[character.archetype]?.approaches[name] || 0;
    if (fixedValue > 0 && value < fixedValue) return;
    const nextValue = Math.max(fixedValue, Math.min(2, value));
    const currentValue = Number(approachDraft[name]) || 0;
    if (approachTotal - currentValue + nextValue > 4) return;
    approachDraft = { ...approachDraft, [name]: nextValue };
  }
  function setCharacterApproach(name: string, value: number) {
    const fixedValue = ARCHETYPES[character.archetype]?.approaches[name] || 0;
    const nextValue = Math.max(fixedValue, Math.min(2, value));
    const currentValue = Number(character.approaches[name]) || 0;
    if (characterApproachTotal - currentValue + nextValue > 4) return;
    character.approaches = { ...character.approaches, [name]: nextValue };
    updateCharacter();
  }
  function addTrait() {
    const trait = traitDraft === 'Conocedor de...' && customTraitField.trim() ? 'Conocedor de ' + customTraitField.trim() : traitDraft;
    if (!trait || character.traits.length >= 4 || character.traits.includes(trait)) return;
    character.traits = [...character.traits, trait];
    const equipment = equipmentForTrait(trait);
    equipment.forEach((name, i) => character.inventory.push({ id: Date.now() + i + character.inventory.length, name, trait }));
    traitDraft = ''; customTraitField = ''; updateCharacter();
  }
  function removeTrait(trait: string) {
    if (isFixedArchetypeTrait(trait)) return;
    character.traits = character.traits.filter(t => t !== trait);
    character.inventory = character.inventory.filter(i => i.trait !== trait);
    updateCharacter();
  }
  function addInventoryItem() {
    character.inventory = [...character.inventory, { id: Date.now(), name: '', trait: 'Personal' }];
    updateCharacter();
  }
  function removeInventoryItem(id: number) {
    character.inventory = character.inventory.filter(i => i.id !== id);
    updateCharacter();
  }
  function finishEdit() {
    if (!characterApproachesValid) {
      alert('Los Enfoques deben sumar exactamente 4 puntos y ninguno puede superar 2.');
      return;
    }
    updateCharacter(); editingCharacter = false;
  }
  function adjustWill(delta: number) { character.will = Math.max(0, Math.min(character.maxWill, character.will + delta)); updateCharacter(); }
  async function restCharacter() {
    try {
      if (OBR.isAvailable) {
        await OBR.broadcast.sendMessage(REST_REQUEST_CHANNEL, {
          playerId: await OBR.player.getId(),
          requestedAt: Date.now()
        }, { destination: 'ALL' });
      } else {
        visibleEffortCoins = Math.max(0, Math.min(3, Number(playerTracker('local').effortCoins ?? 3)));
      }
      adjustWill(2);
      if (!OBR.isAvailable) {
        const tracker = playerTracker('local');
        tracker.overexertionUsed = 0;
        saveGmTracker();
      }
    } catch (error) {
      console.error('No se pudo realizar el descanso', error);
      dicePlusError = 'No se pudo registrar el descanso. Inténtalo de nuevo.';
    }
  }
  function toggleState(id: string, stateName: string) {
    const t = playerTracker(id);
    if (t.states.includes(stateName)) t.states = t.states.filter((s: string) => s !== stateName);
    else t.states = [...t.states, stateName];
    saveGmTracker();
  }
  async function deletePlayerCharacter(player: any, alreadyConfirmed = false) {
    const stored = getPlayerCharacter(player);
    if (!stored?.created) return;
    const name = stored.name || player.name;
    if (!alreadyConfirmed && !confirm(`¿Borrar la ficha de ${name}? El personaje volverá al estado de creación y el jugador tendrá que crearlo nuevamente.`)) return;
    try {
      await OBR.broadcast.sendMessage(DELETE_CHARACTER_CHANNEL, {
        action: 'DELETE_CHARACTER',
        playerId: player.id,
        requestedAt: Date.now()
      }, { destination: 'ALL' });
      const tracker = playerTracker(player.id);
      tracker.states = [];
      tracker.effortCoins = 3;
      const currentMagic = clone(magicData || { players: {} });
      if (currentMagic.players) delete currentMagic.players[player.id];
      await OBR.room.setMetadata({ [MAGIC_KEY]: currentMagic });
      magicData = currentMagic;
      saveGmTracker();
    } catch (error) {
      console.error('No se pudo solicitar el borrado de la ficha', error);
      alert('No se pudo completar el borrado de la ficha. Comprueba la conexión con Owlbear Rodeo.');
    }
  }

  async function requestOwnCharacterDeletion() {
    if (!character.created) return;
    if (!confirm(`¿Eliminar tu personaje ${character.name || ''}? Se borrarán también tus propuestas y conjuros.`)) return;
    if (!OBR.isAvailable || !$currentPlayerId) {
      character = blankCharacter();
      localStorage.removeItem('mimprov-character-v1');
      editingCharacter = false;
      step = 0;
      return;
    }
    try {
      await OBR.broadcast.sendMessage(DELETE_CHARACTER_CHANNEL, {
        action: 'PLAYER_DELETE_REQUEST',
        playerId: $currentPlayerId,
        requestedAt: Date.now()
      }, { destination: 'ALL' });
    } catch (error) {
      console.error('No se pudo solicitar la eliminación del personaje', error);
      alert('No se pudo enviar la solicitud. Comprueba tu conexión con Owlbear Rodeo.');
    }
  }

  function resolveConflict(outcome: 'decisive' | 'resistance' | 'defeat') {
    const conflict = gmTracker.conflict || { active: true, danger: 'Bajo', resistance: null };
    const resistance = Math.max(0, Number(conflict.resistance ?? initialConflictResistance) || 0);
    if (outcome === 'decisive' || resistance <= 0) {
      conflict.result = 'Victoria decisiva: la Resistencia llegó a 0.';
    } else {
      const remainingWill = partyMembers.reduce((total, player) => {
        const will = Number(getPlayerCharacter(player)?.will) || 0;
        return total + Math.max(0, will);
      }, 0);
      if (remainingWill >= resistance) {
        conflict.result = `Victoria por resistencia: ${remainingWill} de Voluntad frente a ${resistance} de Resistencia.`;
      } else {
        conflict.result = `Derrota: ${remainingWill} de Voluntad frente a ${resistance} de Resistencia. Los personajes con 0 Voluntad quedan Abrumados.`;
      }
    }
    conflict.active = false;
    gmTracker.conflict = conflict;
    saveGmTracker();
  }

  function setConflictActive(active: boolean) {
    if (!gmTracker.conflict) gmTracker.conflict = { active: false, danger: 'Bajo', resistance: null };
    if (active) {
      gmTracker.conflict.active = true;
      gmTracker.conflict.result = '';
      saveGmTracker();
      return;
    }
    if (gmTracker.conflict.active) resolveConflict('resistance');
    else {
      gmTracker.conflict.active = false;
      saveGmTracker();
    }
  }
  function adjustConflictResistance(delta: number) {
    if (!gmTracker.conflict) gmTracker.conflict = { danger: 'Bajo', resistance: null };
    const current = gmTracker.conflict.resistance ?? initialConflictResistance;
    gmTracker.conflict.resistance = Math.max(0, current + delta);
    if (gmTracker.conflict.active && gmTracker.conflict.resistance === 0) resolveConflict('decisive');
    else saveGmTracker();
  }
  function resetConflictResistance() {
    if (!gmTracker.conflict) gmTracker.conflict = { danger: 'Bajo', resistance: null };
    gmTracker.conflict.resistance = null;
    saveGmTracker();
  }
  function setConflictDanger(danger: string) {
    if (!gmTracker.conflict) gmTracker.conflict = { active: false, danger: 'Bajo', resistance: null };
    gmTracker.conflict.danger = danger;
    saveGmTracker();
  }
</script>

<svelte:head>
  <title>DummySheet MIMPROV</title>
</svelte:head>

<div class="app-shell">
  {#if !$isGM && sessionStarted}
    <nav class="main-tabs">
      <button class:active={activeTab === 'personaje'} on:click={() => { activeTab = 'personaje'; }}>Personaje</button>
      <button class:active={activeTab === 'tiradas'} on:click={() => { activeTab = 'tiradas'; }}>Tiradas</button>
      <button class:active={activeTab === 'reglamento'} on:click={() => { activeTab = 'reglamento'; }}>Reglamento</button>
      <button class:active={activeTab === 'magia'} on:click={() => { activeTab = 'magia'; }}>Magia</button>
      <button class:active={activeTab === 'notas'} on:click={() => { activeTab = 'notas'; }}>Notas</button>
      <button class:active={activeTab === 'lineas-velos'} on:click={() => { activeTab = 'lineas-velos'; }}>Líneas y velos</button>
    </nav>
  {:else if $isGM}
    <nav class="main-tabs">
      <button class:active={activeTab === 'gm'} on:click={() => { activeTab = 'gm'; }}>Personajes</button>
      <button class:active={activeTab === 'conflicto'} on:click={() => { activeTab = 'conflicto'; }}>Conflicto</button>
      <button class:active={activeTab === 'reglamento'} on:click={() => { activeTab = 'reglamento'; }}>Reglamento</button>
      <button class:active={activeTab === 'magia-gm'} on:click={() => { activeTab = 'magia-gm'; }}>Magia</button>
      <button class:active={activeTab === 'lineas-velos'} on:click={() => { activeTab = 'lineas-velos'; }}>Líneas y velos</button>
      <button class:active={activeTab === 'pnj'} on:click={() => { activeTab = 'pnj'; }}>PNJ</button>
    </nav>
  {/if}

  {#if !$isGM && !sessionStarted}
    <main class="content"><section class="card wizard"><div class="eyebrow">SALA EN ESPERA</div><h1>La sesión aún no ha comenzado</h1><p>La creación de personajes y las demás funciones estarán disponibles cuando el Narrador pulse <strong>Iniciar nueva sesión</strong>.</p></section></main>
  {:else if !$isGM && activeTab === 'personaje'}
    <main class="content">
      {#if !character.created}
        <section class="card wizard">
          <div class="eyebrow">CREACIÓN DE PERSONAJE · PASO {step + 1} DE 9</div>
          <div class="progress"><span style="width:{(step + 1) * 11.111}%"></span></div>
          {#if step === 0}
            <h1>¿Cómo se llama tu personaje?</h1>
            <label>Nombre y apellido<input bind:value={character.name} list="mimprov-name-options" placeholder="Nombre del personaje"></label>
            <datalist id="mimprov-name-options">
              {#each nameOptions as option}<option value={option}></option>{/each}
            </datalist>
            <div class="name-generator">
              <label>Ambientación<select bind:value={nameStyle}>
                <option value="fantasy">Fantasía</option><option value="contemporary">Contemporánea</option><option value="futuristic">Futurista</option>
              </select></label>
              <label>Tipo de nombre<select bind:value={nameGender}>
                <option value="masculine">Hombre</option><option value="feminine">Mujer</option><option value="unisex">Unisex</option>
              </select></label>
              <button type="button" class="name-dice" on:click={generateRandomName} aria-label="Generar nombre aleatorio">🎲 Generar nombre</button>
            </div>
            <small class="muted">Puedes escribir el nombre completo o generar un nombre y apellido aleatorios.</small>
          {:else if step === 1}
            <h1>¿Cuál es su arquetipo?</h1>
            <p>El arquetipo aporta 2 puntos de Enfoque y 2 Rasgos fijos. Junto con el concepto, también define cuándo puedes gastar monedas de esfuerzo.</p>
            <div class="trait-picker"><select value={character.archetype} on:change={(event) => selectArchetype(event.currentTarget.value)}><option value="">Seleccionar arquetipo...</option>{#each Object.keys(ARCHETYPES) as archetype}<option value={archetype}>{archetype}</option>{/each}</select></div>
            {#if character.archetype}<div class="selected-list"><strong>{character.archetype}</strong><p>{ARCHETYPES[character.archetype].description}</p><p>Enfoques: {APPROACHES.filter(name => ARCHETYPES[character.archetype].approaches[name]).join(' 1 · ')} 1.</p><p>Rasgos fijos: {ARCHETYPES[character.archetype].traits.map(traitLabel).join(' · ')}</p></div>{/if}
          {:else if step === 2}
            <h1>¿Cuál es su concepto?</h1>
            <p>Escribe una frase que describa quién es, qué lo caracteriza y qué guía sus acciones. El arquetipo y el concepto están unidos: la acción debe guardar relación con al menos uno de ellos para gastar una moneda de esfuerzo.</p>
            <label>Concepto<textarea bind:value={character.concept} rows="3" placeholder="Una exploradora que busca rutas seguras entre ciudades aisladas..."></textarea></label>
            <div class="name-generator concept-generator">
              <label>Género narrativo<select bind:value={conceptGenre}>
                <option value="fantasy">Fantasía</option><option value="scifi">Ciencia ficción</option><option value="horror">Terror</option><option value="modern">Contemporáneo / urbano</option><option value="postapocalyptic">Postapocalíptico</option>
              </select></label>
              <button type="button" class="name-dice" on:click={generateRandomConcept} aria-label="Generar concepto aleatorio">🎲 Generar concepto</button>
            </div>
            <small class="muted">Elige un género y genera una frase aleatoria. Puedes editarla libremente. </small>
          {:else if step === 3}
            <h1>¿Qué edad tiene?</h1>
            <label>Edad<input bind:value={character.age} placeholder="Edad o rango aproximado"></label>
          {:else if step === 4}
            <h1>¿Cómo es su apariencia?</h1>
            <p>Elige un rango de edad y si el personaje es hombre o mujer para recibir descripciones físicas generales que puedas usar o modificar.</p>
            <div class="name-generator">
              <label>Rango de edad<select bind:value={appearanceAge} on:change={syncAppearanceAge}>
                {#each APPEARANCE_AGES as age}<option value={age.value}>{age.label}</option>{/each}
              </select></label>
              <label>Género<select bind:value={appearanceGender}>
                <option value="male">Hombre</option><option value="female">Mujer</option>
              </select></label>
              <button type="button" class="name-dice" on:click={generateRandomAppearance}>🎲 Generar apariencia</button>
            </div>
            <label>Descripción física<textarea bind:value={character.appearance} rows="3" placeholder="La descripción completa aparecerá aquí. También puedes escribirla o modificarla."></textarea></label>
            <small class="muted">Cada generación combina al azar rasgos independientes —piel, ojos, cabello, rostro y complexión— en una sola descripción. La selección de rasgos ocurre internamente.</small>
          {:else if step === 5}
            <h1>Distribuye sus Enfoques</h1>
            <p>El arquetipo aporta 2 puntos. Distribuye los otros 2 entre los Enfoques restantes. Ningún Enfoque puede superar 2 puntos.</p>
            {#each APPROACHES as name}
              <div class="approach-row"><div><strong>{name}</strong><small>{APPROACH_DESCRIPTIONS[name].long}{#if ARCHETYPES[character.archetype]?.approaches[name]} · Punto asignado por el arquetipo.{/if}</small></div><div class="stepper"><button on:click={() => setApproach(name, approachDraft[name] - 1)} disabled={approachDraft[name] <= (ARCHETYPES[character.archetype]?.approaches[name] || 0)}>−</button><b>{approachDraft[name]}</b><button on:click={() => setApproach(name, approachDraft[name] + 1)} disabled={approachDraft[name] >= 2 || approachTotal >= 4}>+</button></div></div>
            {/each}
            <div class:valid={approachValid} class="total-points">Puntos distribuidos: {approachTotal} / 4</div>
          {:else if step === 6}
            <h1>Completa tus cuatro Rasgos</h1>
            <p>El arquetipo aporta dos Rasgos fijos. Escoge otros dos de la lista disponible.</p>
            <div class="selected-list"><strong>Rasgos fijos del arquetipo</strong>{#each character.traits.slice(0, 2) as trait}<div class="selected-item"><span>{traitLabel(trait, selectedGenre)}</span><small>Fijo</small></div>{/each}</div>
            {#if ARCHETYPES[character.archetype]?.traits.includes('Conocedor de...')}<label>{traitLabel('Conocedor de...', selectedGenre)}<input list="mimprov-knowledge-options" value={character.traits.find((trait) => trait.startsWith('Conocedor de '))?.replace('Conocedor de ', '') || ''} on:input={(event) => updateArchetypeKnowledge(event.currentTarget.value)} placeholder="Elige o escribe un conocimiento"></label><datalist id="mimprov-knowledge-options">{#each knowledgeOptions(selectedGenre) as option}<option value={option}></option>{/each}</datalist>{/if}
            <div class="trait-picker">
              <select bind:value={traitDraft}><option value="">Seleccionar Rasgo...</option>{#each TRAITS as trait}<option value={trait} disabled={character.traits.includes(trait) || character.traits.length >= 4}>{traitLabel(trait, selectedGenre)}</option>{/each}</select>
              {#if traitDraft === 'Conocedor de...'}<input bind:value={customTraitField} list="mimprov-knowledge-options" placeholder="¿Conocedor de qué?"><datalist id="mimprov-knowledge-options">{#each knowledgeOptions(selectedGenre) as option}<option value={option}></option>{/each}</datalist>{/if}
              <button on:click={addTrait} disabled={!traitDraft || (traitDraft === 'Conocedor de...' && !customTraitField.trim())}>Añadir</button>
            </div>
            <div class="selected-list">{#each character.traits as trait}<div class="selected-item trait-description"><div><strong>{traitLabel(trait, selectedGenre)}</strong><small>{traitLabel(trait.startsWith('Conocedor de ') ? 'Conocedor de...' : trait, selectedGenre)} </small><p>{trait.startsWith('Conocedor de ') ? 'Posees conocimientos y experiencia en ' + trait.slice('Conocedor de '.length) + '. Puedes reconocer elementos propios de esa materia, comprender información especializada, recordar procedimientos y resolver problemas relacionados con ese ámbito.' : TRAIT_DESCRIPTIONS[trait]?.long || ''}</p></div>{#if isFixedArchetypeTrait(trait)}<small>Fijo</small>{:else}<button class="remove" on:click={() => removeTrait(trait)}>Quitar</button>{/if}</div>{/each}</div>
            <div class="total-points" class:valid={character.traits.length === 4}>Rasgos seleccionados: {character.traits.length} / 4</div>
          {:else if step === 7}
            <h1>Prepara su equipo</h1>
            <p>Cada Rasgo entrega tres objetos asociados. Puedes editar los nombres de los objetos y añadir pertenencias personales.</p>
            {#each character.traits as trait}
              <div class="equipment-group"><h3>{traitLabel(trait, selectedGenre)}</h3>{#each character.inventory.filter(i => i.trait === trait) as item}
                <label class="inline-label"><input value={equipmentDisplayName(item, selectedGenre)} placeholder="Nombre del objeto" on:input={(e) => { item.name = e.currentTarget.value; updateCharacter(); }}></label>
              {/each}</div>
            {/each}
            <button class="secondary" on:click={addInventoryItem}>Añadir objeto personal</button>
            {#each character.inventory.filter(i => i.trait === 'Personal') as item}
              <div class="inventory-row"><input bind:value={item.name} placeholder="Objeto personal"><button class="remove" on:click={() => removeInventoryItem(item.id)}>×</button></div>
            {/each}
            <div class="total-points" class:valid={inventoryValid}>Cada Rasgo debe tener tres objetos con nombre. Los objetos personales también deben tener nombre. Total actual: {character.inventory.length}</div>
          {:else}
            <h1>Revisa el personaje</h1>
            <div class="summary"><p><strong>{character.name || 'Sin nombre'}</strong></p><p>{character.archetype} · {character.concept}</p><h3>Enfoques</h3>{#each APPROACHES as name}<p>{name}: {approachDraft[name]}</p>{/each}<h3>Rasgos</h3><p>{character.traits.map((trait) => traitLabel(trait, selectedGenre)).join(' · ')}</p><h3>Equipo</h3><p>{character.inventory.map(i => equipmentDisplayName(i, selectedGenre) || 'Objeto por definir').join(' · ')}</p><p>Voluntad inicial: 4 / 4</p><p>Monedas de esfuerzo iniciales: 3 / 3</p></div>
          {/if}
          <div class="wizard-actions">
            {#if step > 0}<button class="secondary" on:click={previousStep}>Anterior</button>{/if}
            <button on:click={nextStep} disabled={(step === 1 && !character.archetype) || (step === 2 && !character.concept.trim()) || (step === 5 && !approachValid) || (step === 6 && character.traits.length !== 4) || (step === 7 && !inventoryValid)}>{step === 8 ? 'Crear personaje' : 'Continuar'}</button>
          </div>
        </section>
      {:else}
        <section class="character-sheet">
          <header class="sheet-header"><div class="sheet-title-group"><div class="character-portrait-wrap">{#if character.portrait}<img class="character-portrait" src={character.portrait} alt="Retrato de {character.name || 'personaje'}">{:else}<div class="character-portrait character-portrait-empty" aria-label="Sin retrato">?</div>{/if}</div><div class="sheet-title"><div class="eyebrow">PERSONAJE MIMPROV</div><h1>{character.name || 'Sin nombre'}</h1><p>{character.archetype} · {character.concept}</p><div class="portrait-actions"><label class="import-button portrait-upload">Subir imagen<input type="file" accept="image/*" on:change={uploadCharacterPortrait}></label>{#if character.portrait}<button class="secondary" on:click={removeCharacterPortrait}>Quitar imagen</button>{/if}<small>Imagen cuadrada de 512 × 512 px.</small></div></div></div><div class="sheet-header-actions"><button class="secondary" on:click={() => editingCharacter = !editingCharacter}>{editingCharacter ? 'Cerrar edición' : 'Editar ficha'}</button><button class="danger-button" on:click={requestOwnCharacterDeletion}>Eliminar personaje</button></div></header>
          <section class="card extra-info"><h2>Datos del personaje</h2><p><strong>Edad:</strong> {character.age || '—'}</p><p><strong>Apariencia:</strong> {character.appearance || '—'}</p><p><strong>Experiencia:</strong> {character.experience || '—'}</p></section>
          {#if editingCharacter}
            <div class="card edit-card">
              <label>Nombre<input bind:value={character.name} on:input={updateCharacter}></label>
              <label>Concepto<textarea bind:value={character.concept} on:input={updateCharacter}></textarea></label>
              <label>Edad<input bind:value={character.age} on:input={updateCharacter}></label>
              <label>Apariencia<textarea bind:value={character.appearance} on:input={updateCharacter}></textarea></label>
              <label>Experiencia<input bind:value={character.experience} on:input={updateCharacter}></label>
              <h3>Enfoques</h3><p class="muted">Puntos distribuidos: {characterApproachTotal} / 4. Máximo 2 por Enfoque; los puntos del arquetipo son fijos.</p>{#each APPROACHES as name}<div class="approach-row"><strong>{name}</strong><div class="stepper"><button on:click={() => setCharacterApproach(name, character.approaches[name] - 1)} disabled={character.approaches[name] <= (ARCHETYPES[character.archetype]?.approaches[name] || 0)}>−</button><b>{character.approaches[name]}</b><button on:click={() => setCharacterApproach(name, character.approaches[name] + 1)} disabled={character.approaches[name] >= 2 || characterApproachTotal >= 4}>+</button></div></div>{/each}
              <h3>Rasgos</h3>{#if ARCHETYPES[character.archetype]?.traits.includes('Conocedor de...')}<label>{traitLabel('Conocedor de...', selectedGenre)}<input list="mimprov-knowledge-options" value={character.traits.find((trait) => trait.startsWith('Conocedor de '))?.replace('Conocedor de ', '') || ''} on:input={(event) => updateArchetypeKnowledge(event.currentTarget.value)} placeholder="Elige o escribe un conocimiento"></label><datalist id="mimprov-knowledge-options">{#each knowledgeOptions(selectedGenre) as option}<option value={option}></option>{/each}</datalist>{/if}{#each character.traits as trait}<div class="selected-item"><span>{traitLabel(trait, selectedGenre)}</span>{#if isFixedArchetypeTrait(trait)}<small>Fijo</small>{:else}<button class="remove" on:click={() => removeTrait(trait)}>Quitar</button>{/if}</div>{/each}<div class="trait-picker"><select bind:value={traitDraft}><option value="">Añadir Rasgo...</option>{#each TRAITS as trait}<option value={trait} disabled={character.traits.includes(trait) || character.traits.length >= 4}>{traitLabel(trait, selectedGenre)}</option>{/each}</select>{#if traitDraft === 'Conocedor de...'}<input bind:value={customTraitField} list="mimprov-knowledge-options" placeholder="Elige o escribe un conocimiento"><datalist id="mimprov-knowledge-options">{#each knowledgeOptions(selectedGenre) as option}<option value={option}></option>{/each}</datalist>{/if}<button on:click={addTrait} disabled={!traitDraft || (traitDraft === 'Conocedor de...' && !customTraitField.trim())}>Añadir</button></div>
              <button on:click={finishEdit}>Guardar cambios</button>
            </div>
          {/if}
          <section class="card export-tools">
            <h2>Exportar e importar ficha</h2>
            <p class="muted">Guarda una copia de tu personaje en un archivo JSON o carga una copia exportada anteriormente.</p>
            <div class="export-actions">
              <button on:click={exportCharacter}>Exportar personaje</button>
              <label class="import-button">Importar personaje<input type="file" accept="application/json,.json" on:change={importCharacter}></label>
            </div>
          </section>
          <div class="sheet-grid">
            <section class="card"><h2>Enfoques</h2>{#each APPROACHES as name}<div class="approach-row compact"><div><strong>{name}</strong><small>{APPROACH_DESCRIPTIONS[name].short}</small></div><span class="score">{character.approaches[name]}</span></div>{/each}</section>
            <section class="card"><h2>Rasgos</h2>{#each character.traits as trait}<div class="trait-line"><strong>{traitLabel(trait, selectedGenre)}</strong><small>{traitLabel(trait.startsWith('Conocedor de ') ? 'Conocedor de...' : trait, selectedGenre)} </small><p>{trait.startsWith('Conocedor de ') ? 'Conocimientos y experiencia en ' + trait.slice('Conocedor de '.length) + '.' : TRAIT_DESCRIPTIONS[trait]?.short || ''}</p></div>{/each}</section>
            <section class="card"><h2>Voluntad</h2><div class="will-value">{character.will}<small> / {character.maxWill}</small></div><div class="will-controls"><button on:click={() => adjustWill(-1)} disabled={character.will <= 0}>−</button><button on:click={() => adjustWill(1)} disabled={character.will >= character.maxWill}>+</button></div><button class="secondary full" on:click={restCharacter}>Descansar</button><p class="muted">Recuperas 2 puntos de Voluntad (sin superar el máximo). El descanso no recupera monedas de esfuerzo. Con 0 Voluntad, siempre tiras 2d6 y conservas el menor, sin importar ventaja o desventaja.</p></section>
            <section class="card extra-info"><h2>Monedas de esfuerzo</h2><div class="will-value">{visibleEffortCoins}<small> / 3 disponibles</small></div><p class="muted">Cada moneda permite añadir 1d6 a la próxima tirada o repetir todos los dados de la última tirada ignorando los Estados o Desventajas que resten dados. Gastarla no genera Estados. Se restablecen a 3 al comenzar cada sesión.</p><button class="secondary full" on:click={() => spendEffort('extra-die')} disabled={visibleEffortCoins <= 0 || !!pendingDiceRoll || effortDiceBonus > 0}>Gastar moneda: +1d6 a la próxima tirada</button>{#if lastRoll}<button class="secondary full" on:click={() => spendEffort('reroll')} disabled={visibleEffortCoins <= 0 || !!pendingDiceRoll}>Gastar moneda: repetir última tirada</button>{/if}</section>
            <section class="card"><h2>Estados</h2><div class="state-grid">{#each [...STATES, ...(Number(character.will) <= 0 ? [{ name: 'Abrumado', enfoque: 'Todos', detail: 'Con 0 Voluntad, todas las tiradas usan 2d6 y conservan el menor.' }] : [])] as state}<label class="check-row"><input type="checkbox" checked={displayedStates.includes(state.name)} disabled><span><b>{state.name}</b><small>{state.enfoque}: {state.detail}</small></span></label>{/each}</div></section>
            <section class="card"><h2>Equipo</h2>{#each character.inventory as item}<div class="inventory-line"><input value={equipmentDisplayName(item, selectedGenre)} placeholder="Objeto por definir" on:input={(event) => { item.name = event.currentTarget.value; updateCharacter(); }}><small>{traitLabel(item.trait, selectedGenre)}</small><button class="remove" on:click={() => removeInventoryItem(item.id)}>×</button></div>{/each}<button class="secondary full" on:click={addInventoryItem}>Añadir objeto</button></section>
          </div>
          <p class="sync-note">{OBR.isAvailable ? 'La ficha se sincroniza con Owlbear Rodeo.' : 'Modo de vista previa: la ficha se guarda en este navegador.'}</p>
        </section>
      {/if}
    </main>
  {:else if !$isGM && activeTab === 'tiradas'}
    <main class="content">
      <div class="eyebrow">CONSTRUCTOR DE POOL</div>
      <h1>Tiradas</h1>
      {#if !character.created}
        <section class="card"><p>Primero debes crear tu personaje para construir una reserva de dados.</p></section>
      {:else}
        <section class="card pool-builder">
          <h2>Construye tu pool</h2>
          <label>Enfoque
            <select bind:value={selectedApproach}>
              {#each APPROACHES as approach}
                <option value={approach}>{approach} · {character.approaches[approach] || 0}d6</option>
              {/each}
            </select>
          </label>
          {#if playerMagicRecord?.spells?.length}
            <label>Conjuro (opcional)
              <select bind:value={selectedMagicSpellId}>
                <option value="">Tirada normal, sin magia</option>
                {#each playerMagicRecord.spells as spell}
                  <option value={spell.id}>{spell.effect.slice(0, 90)} · {magicMagnitudeLabel(spell.magnitude)}</option>
                {/each}
              </select>
            </label>
            {#if selectedMagicSpell}<p class="muted">Conjuro seleccionado: {selectedMagicSpell.name || selectedMagicSpell.effect} · {magicMagnitudeLabel(selectedMagicSpell.magnitude)}{#if selectedMagicSpell.willCost} · Coste: {selectedMagicSpell.willCost} Voluntad{/if}. Se realiza esta misma tirada normal.</p>{/if}
          {/if}
          <label>Rasgo
            <select bind:value={selectedTrait}>
              <option value="">Sin Rasgo</option>
              {#each character.traits as trait}
                <option value={trait}>{traitLabel(trait, selectedGenre)}</option>
              {/each}
            </select>
          </label>
          <div class="modifier-picker">
            <span>Modificador</span>
            <div class="modifier-options">
              <button class:active={rollModifier === 'normal'} class="secondary" on:click={() => rollModifier = 'normal'}>Normal</button>
              <button class:active={rollModifier === 'advantage'} class="secondary" on:click={() => rollModifier = 'advantage'}>Ventaja (+1d6)</button>
              <button class:active={rollModifier === 'disadvantage'} class="secondary" on:click={() => rollModifier = 'disadvantage'}>Desventaja (−1d6)</button>
            </div>
          </div>
          <div class="pool-summary">
            <div><small>Notación enviada a Dice+</small><strong>{diceNotation}</strong></div>
            <ul>
              <li>{selectedApproach}: +{selectedApproachScore}d6</li>
              <li>{selectedTrait ? selectedTrait + ': +1d6' : 'Sin Rasgo: +0d6'}</li>
              <li>{forcedLowRoll ? 'Voluntad 0: siempre tira 2d6 y conserva el menor; se ignoran ventaja y desventaja' : rollModifier === 'advantage' ? 'Ventaja: añade 1d6 y conserva el mayor' : rollModifier === 'disadvantage' ? (dicePool <= 0 ? 'Desventaja: reduce 1d6; al quedar en 0 dados, tira 2d6 y conserva el menor' : 'Desventaja: resta 1d6 y conserva el mayor') : 'Tirada normal: conserva el mayor'}</li>
            </ul>
          </div>
          {#if dicePlusError}<p class="error-message">{dicePlusError}</p>{/if}
          
          <button class="roll-button" disabled={!!pendingDiceRoll} on:click={rollDice}>{pendingDiceRoll ? 'Tirando…' : effortDiceBonus > 0 ? 'Tirar dados con +1d6' : 'Tirar dados con Dice+'}</button>
          {#if visibleEffortCoins > 0}
            <button class="secondary full" on:click={() => spendEffort('extra-die')} disabled={!!pendingDiceRoll || effortDiceBonus > 0}>Gastar moneda: +1d6 a la próxima tirada</button>
            {#if lastRoll}
              <button class="secondary full" on:click={() => spendEffort('reroll')} disabled={!!pendingDiceRoll}>Gastar moneda: repetir última tirada</button>
            {/if}
          {/if}
        </section>
        {#if lastRoll}
          <section class="card roll-result" class:failure={lastRoll.result === 'Fracaso'} class:consequence={lastRoll.result === 'Éxito con consecuencia'} class:success={lastRoll.result === 'Éxito limpio'} class:critical={lastRoll.result === 'Éxito crítico'}>
            <div class="roll-result-heading">
              <div><span class="result-kicker">RESULTADO DE LA TIRADA</span><h2>{lastRoll.result}</h2></div>
              {#if lastRoll.approach}<span class="result-approach">{lastRoll.approach}</span>{/if}
            </div>
            <p class="result-description">{resultDescription(lastRoll.result)}</p>
            <div class="dice-results">{#each lastRoll.dice as die, i}<span class:kept={die === lastRoll.kept && (lastRoll.notation?.includes("kl1") ? die === Math.min(...lastRoll.dice) : die === Math.max(...lastRoll.dice))} class="die">{die}</span>{/each}</div>
            <div class="kept-result">Dado conservado: <strong>{lastRoll.kept}</strong></div>
            {#if lastRoll.critical}<p class="critical-reward">Éxito crítico: recuperas 1 punto de Voluntad.</p>{/if}
            {#if lastRoll.summary}<p class="muted">{lastRoll.summary}</p>{/if}
            {#if selectedMagicSpell && lastRoll.result !== 'Fracaso'}
              <p class="critical-reward">Contribución mágica al conflicto: {lastRoll.dice.filter((die) => die === 6).length + selectedMagicSpellBonus} éxitos ({lastRoll.dice.filter((die) => die === 6).length} éxitos obtenidos + {selectedMagicSpellBonus} adicionales). Los éxitos adicionales no modifican el resultado narrativo ni cuentan para críticos.</p>
            {:else if selectedMagicSpell}
              <p class="muted">El conjuro no añade éxitos: la tirada fue un fracaso.</p>
            {/if}
          </section>
        {/if}
        <section class="card roll-history">
          <div class="history-heading"><div><h2>Registro de tiradas</h2><p class="muted">Se conservan las últimas 50 tiradas de este personaje en esta sala.</p></div><button class="secondary clear-history" on:click={clearRollHistory} disabled={!rollHistory.length}>Borrar registro</button></div>
          {#if rollHistory.length}
            <div class="history-list">
              {#each rollHistory as entry}
                <article class="history-entry">
                  <div class="history-meta"><strong>{entry.result}</strong><span>{entry.approach}</span><time>{new Date(entry.timestamp).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></div>
                  <div class="history-dice">{#each entry.dice as die}<span class:kept={die === entry.kept && (entry.notation?.includes('kl1') ? die === Math.min(...entry.dice) : die === Math.max(...entry.dice))} class="die small-die">{die}</span>{/each}<span class="history-kept">Conservado: {entry.kept}</span></div>
                </article>
              {/each}
            </div>
          {:else}
            <p class="muted">Todavía no hay tiradas registradas.</p>
          {/if}
          <div class="result-thresholds">
            <span><b>1–4</b> Fallo</span><span><b>5</b> Éxito con consecuencia</span><span><b>6</b> Éxito limpio</span><span><b>2 o más 6</b> Éxito crítico</span>
          </div>
        </section>
      {/if}
    </main>
  {:else if $isGM && (activeTab === 'gm' || activeTab === 'conflicto')}
    <main class="content gm-content">
      {#if activeTab === 'gm'}
      <div class="eyebrow">HERRAMIENTAS DEL NARRADOR</div><h1>Personajes</h1>
      <section class="card"><h2>Ambientación de la partida</h2><p class="muted">Esta selección aplica una skin global a todos los personajes de la sala: adapta los nombres de Rasgos, conocimientos y objetos de equipo, incluidos los personajes ya creados. No cambia sus Enfoques, capacidades, reglas ni objetos personalizados.</p><label for="mimprov-genre">Género o ambientación</label><select id="mimprov-genre" value={selectedGenre} on:change={(event) => changeGenre(event.currentTarget.value)}>{#each GENRES as genre}<option value={genre.id}>{genre.label}</option>{/each}</select><p class="muted">La ambientación se comparte con todos los jugadores de esta sala.</p></section>
      <p class="muted">Seguimiento independiente. Estos controles no modifican las fichas de los jugadores.</p>
            <section class="card"><h2>Sesión</h2><p class="muted">{sessionStarted ? 'Sesión iniciada. Los jugadores pueden crear sus personajes y utilizar la ficha.' : 'La sesión todavía no ha comenzado. Los jugadores verán una pantalla de espera y no podrán iniciar la creación de personajes.'}</p><button on:click={startNewSession}>Iniciar nueva sesión</button></section>
      <section class="card"><h2>Personajes de la sala</h2>
        {#if partyMembers.length === 0}
          <p>No hay personajes creados en la sala.</p>
        {:else}
          <nav class="character-tabs" aria-label="Personajes">
            {#each partyMembers as player}
              <button class:active={selectedPlayerId === player.id} on:click={() => selectedPlayerId = player.id}>{getPlayerCharacter(player)?.name || player.name}</button>
            {/each}
          </nav>
          {#each partyMembers.filter(p => p.id === selectedPlayerId) as player}
            <article class="gm-player">
              <div class="gm-player-head"><div class="gm-player-identity">{#if getPlayerCharacter(player)?.portrait}<img class="gm-player-portrait" src={getPlayerCharacter(player)?.portrait} alt="Retrato de {getPlayerCharacter(player)?.name || player.name}">{/if}<div><h3>{getPlayerCharacter(player)?.name || player.name}</h3><small>{getPlayerCharacter(player)?.created ? getPlayerCharacter(player)?.concept : 'Ficha MIMPROV aún no creada'}</small></div></div>{#if getPlayerCharacter(player)?.created}<button class="danger-button" on:click={() => deletePlayerCharacter(player)}>Borrar personaje</button>{/if}</div>
              {#if getPlayerCharacter(player)?.created}
                <div class="gm-stats"><span>Voluntad: <b>{getPlayerCharacter(player)?.will} / {getPlayerCharacter(player)?.maxWill}</b></span><span>Enfoques: <b>{APPROACHES.map(a => a + ' ' + (getPlayerCharacter(player)?.approaches?.[a] ?? 0)).join(' · ')}</b></span><span>Rasgos: <b>{(getPlayerCharacter(player)?.traits || []).map((trait) => traitLabel(trait, selectedGenre)).join(', ')}</b></span></div><p class="muted"><b>Equipo:</b> {(getPlayerCharacter(player)?.inventory || []).map((item) => equipmentDisplayName(item, selectedGenre)).join(' · ')}</p>
              {:else}<p class="muted">El jugador todavía no ha creado su ficha.</p>{/if}
              <h4>Estados actuales</h4><div class="state-grid">{#each STATES as state}<label class="check-row"><input type="checkbox" checked={playerTracker(player.id).states.includes(state.name)} on:change={() => toggleState(player.id, state.name)}><span><b>{state.name}</b><small>{state.enfoque}: {state.detail}</small></span></label>{/each}</div>
              <h4>Monedas de esfuerzo</h4><p class="muted">Disponibles: {playerTracker(player.id).effortCoins} / 3</p><small class="muted">Las monedas permiten añadir 1d6 a una tirada o repetir todos los dados ignorando los Estados o Desventajas que resten dados. Gastarlas no genera Estados. El descanso no las recupera.</small>
            </article>
          {/each}
        {/if}
      </section>
      <p class="sync-note">El seguimiento de personajes se guarda localmente en este dispositivo y sala.</p>
      {:else}
      <div class="eyebrow">SEGUIMIENTO DEL NARRADOR</div><h1>Conflicto</h1>
      <section class="card">
        <h2>Estado del conflicto</h2>
        <p class="muted">Al activar el conflicto, todos los personajes creados quedan involucrados. Sus tiradas fallidas aplican la pérdida de Voluntad según el peligro.</p>
        <button class:active={gmTracker.conflict.active} on:click={() => setConflictActive(!gmTracker.conflict.active)}>{gmTracker.conflict.active ? 'Terminar conflicto' : 'Iniciar conflicto'}</button>
        <p class="muted">{gmTracker.conflict.active ? 'Conflicto activo para todos los personajes.' : 'No hay un conflicto activo.'}</p>
        {#if gmTracker.conflict.result}<p class="conflict-result">{gmTracker.conflict.result}</p>{/if}
      </section>
      <section class="card">
        <h2>Peligro</h2>
        <p class="muted">Selecciona el nivel de peligro de la situación.</p>
        <div class="danger-levels">
          {#each ['Bajo', 'Medio', 'Alto'] as danger}
            <button class:active={gmTracker.conflict.danger === danger} class="secondary" on:click={() => setConflictDanger(danger)}>{danger}</button>
          {/each}
        </div>
      </section>
      <section class="card">
        <h2>Resistencia</h2>
        <p class="muted">Resistencia inicial: 2 por personaje creado (Voluntad base 4 ÷ 2).</p>
        <div class="resistance-value">{gmTracker.conflict.resistance ?? initialConflictResistance}</div>
        <p class="muted">{createdCharacterCount} personaje(s) creado(s) · Resistencia inicial: {initialConflictResistance}</p>
        <div class="resistance-controls">
          <button class="secondary" on:click={() => adjustConflictResistance(-1)} disabled={(gmTracker.conflict.resistance ?? initialConflictResistance) <= 0}>−1</button>
          <button on:click={() => adjustConflictResistance(1)}>+1</button>
          <button class="secondary" on:click={resetConflictResistance}>Restablecer</button>
        </div>
      </section>
      <p class="sync-note">El seguimiento del conflicto se sincroniza con los jugadores de la sala. Fallo: Bajo −1 Voluntad · Medio −2 · Alto −3.</p>
      {/if}
    </main>
  {:else if !$isGM && activeTab === 'magia'}
    <main class="content magic-content"><div class="eyebrow">PACTOS Y CONDICIONES</div><h1>Magia</h1>
      <p class="magic-intro">Crea poderes mediante pactos. Describe el efecto, elige su magnitud y acuerda con el GM un coste proporcional. La magia se resuelve con una tirada normal.</p>
      <section class="card"><h2>Catálogo de conjuros</h2>
        <p class="muted">Elige directamente los conjuros de ejemplo que quieras incorporar a tu personaje. No necesitan aprobación del GM. El coste se paga en Voluntad al realizar la tirada.</p>
        {#each [...new Set(MAGIC_CATALOG.map((spell) => spell.category))] as category}
          <div class="magic-catalog-group"><h3>{category}</h3>
            {#each MAGIC_CATALOG.filter((spell) => spell.category === category) as spell}
              <article class="pact-item catalog-spell"><h3>{spell.name}</h3><p>{spell.effect}</p>
                <p class="muted">{magicMagnitudeLabel(spell.magnitude)} · Coste: {spell.willCost} {spell.willCost === 1 ? 'punto' : 'puntos'} de Voluntad</p>
                {#if playerMagicRecord?.spells?.some((item: any) => item.id === spell.id)}<button class="secondary" disabled>Ya está en tu lista</button>
                {:else}<button on:click={() => addCatalogSpell(spell)}>Añadir a mi personaje</button>{/if}
              </article>
            {/each}
          </div>
        {/each}
      </section>
      {#if (playerMagicRecord?.spells || []).some((spell: any) => spell.source === 'catalog')}
        <section class="card"><h2>Mis conjuros de catálogo</h2>
          {#each playerMagicRecord.spells.filter((spell: any) => spell.source === 'catalog') as spell}
            <article class="pact-item approved-spell"><h3>{spell.name}</h3><p>{spell.effect}</p><p class="muted">{magicMagnitudeLabel(spell.magnitude)} · Coste: {spell.willCost} Voluntad</p><button class="secondary" on:click={() => removeCatalogSpell(spell.id)}>Quitar de mi lista</button></article>
          {/each}
        </section>
      {/if}
      <section class="card"><h2>¿Qué quieres conseguir?</h2><p>Describe el efecto, su objetivo, alcance y duración. Puedes crear efectos para percibir, crear, alterar, controlar, proteger, comunicar, dañar o restaurar. Son ideas orientativas, no una lista cerrada.</p><textarea bind:value={magicEffect} rows="5" maxlength="4000" placeholder="Describe el efecto que quieres conseguir..."></textarea><small class="field-hint">{magicEffect.length} / 4000 caracteres</small></section>
      <section class="card"><h2>Magnitud del conjuro</h2><label>Elige la magnitud propuesta<select bind:value={magicMagnitude}><option value="simple">Truco simple — sin éxitos adicionales</option><option value="moderate">Magia moderada — +1 éxito si la tirada tiene éxito</option><option value="extraordinary">Magia extraordinaria — +2 éxitos si la tirada tiene éxito</option></select></label><p class="muted">Los éxitos adicionales solo cuentan para reducir la Resistencia de un conflicto. No cambian el resultado narrativo ni cuentan para críticos.</p></section>
      <section class="card"><h2>¿Qué das a cambio?</h2><p>El coste debe ser proporcional al poder. Puede consistir en perder Voluntad, recibir Mermado, Deprimido, Ansioso o Confundido, o ambas cosas. Abrumado aparece únicamente al llegar a 0 Voluntad. El precio puede pagarse una sola vez al establecer el pacto o cada vez que utilizas el poder.</p><textarea bind:value={magicPrice} rows="5" maxlength="4000" placeholder="Describe el coste y cuándo se paga..."></textarea><small class="field-hint">{magicPrice.length} / 4000 caracteres</small><button class="full" on:click={submitMagicPact} disabled={!magicEffect.trim() || !magicPrice.trim()}>Firmar pacto</button>{#if magicMessage}<p class="magic-message">{magicMessage}</p>{/if}</section>
      {#if getMyMagicRecord().proposals?.some((pact) => pact.status !== 'accepted')}<section class="card"><h2>Mis propuestas</h2>{#each [...getMyMagicRecord().proposals].filter((pact) => pact.status !== 'accepted').sort((a, b) => b.createdAt - a.createdAt) as pact}<article class="pact-item"><div class="pact-status" class:pending={pact.status === 'pending'} class:rejected={pact.status === 'rejected'}>{pact.status === 'pending' ? 'Pendiente de revisión' : 'Rechazado'}</div><h3>Efecto</h3><p>{pact.effect}</p><h3>Magnitud</h3><p>{magicMagnitudeLabel(pact.magnitude)}</p><h3>Coste</h3><p>{pact.price}</p></article>{/each}</section>{/if}
      {#if getMyMagicRecord().spells?.length}<section class="card"><h2>Mis conjuros aprobados</h2>{#each getMyMagicRecord().spells as pact}<article class="pact-item approved-spell"><div class="pact-status accepted">Pacto aprobado</div><h3>Efecto</h3><p>{pact.effect}</p><h3>Magnitud</h3><p>{magicMagnitudeLabel(pact.magnitude)}</p><h3>Precio</h3><p>{pact.price}</p></article>{/each}</section>{/if}
    </main>
  {:else if $isGM && activeTab === 'magia-gm'}
    <main class="content magic-content"><div class="eyebrow">REVISIÓN DE PACTOS</div><h1>Magia</h1>
      <p class="magic-intro">Revisa el efecto, la magnitud y que el coste sea proporcional. La magia se resuelve con una tirada normal; los éxitos adicionales solo cuentan para reducir la Resistencia de un conflicto y no cambian el resultado narrativo ni cuentan para críticos.</p>
      {#each Object.entries(magicData?.players || {}) as [playerId, record]}
        {#each (record.proposals || []).filter((pact) => pact.status === 'pending') as pact}
          <section class="card pact-review"><div class="eyebrow">PROPUESTA DE {pact.playerName || 'JUGADOR'}</div>
            <h2>¿Qué quiere conseguir?</h2><p class="pact-text">{pact.effect}</p>
            <h2>Magnitud</h2><p>{magicMagnitudeLabel(pact.magnitude)}</p>
            <h2>¿Qué da a cambio?</h2><p class="pact-text">{pact.price}</p>
            <div class="pact-actions"><button on:click={() => updateMagicPact(playerId, pact.id, 'accepted')}>Aceptar pacto</button><button class="secondary" on:click={() => updateMagicPact(playerId, pact.id, 'rejected')}>Rechazar</button></div>
          </section>
        {/each}
      {/each}
      {#if !Object.values(magicData?.players || {}).some((record) => (record.proposals || []).some((pact) => pact.status === 'pending'))}
        <section class="card"><p>No hay pactos pendientes de revisión.</p></section>
      {/if}
    </main>
  {:else if !$isGM && activeTab === 'notas'}
    <main class="content notes-content">
      <div class="eyebrow">CUADERNO DE PARTIDA</div>
      <h1>Notas</h1>
      <p class="notes-intro">Anota pistas, nombres, lugares, acontecimientos o cualquier detalle importante de la partida. Tus notas se guardan automáticamente y quedan asociadas a tu jugador.</p>
      <section class="card">
        <label for="player-notes">Mis notas</label>
        <textarea id="player-notes" class="player-notes" bind:value={character.notes} on:input={updateCharacter} placeholder="Escribe aquí tus notas de la partida..." rows="18"></textarea>
        <small class="muted">Guardado automático.</small>
      </section>
    </main>
  {:else if $isGM && activeTab === 'pnj'}
    <main class="content gm-content">
      <div class="eyebrow">HERRAMIENTAS DEL NARRADOR</div>
      <h1>Personajes no jugadores</h1>
      <p class="muted">Elige una ambientación para generar cinco personajes no jugadores aleatorios de ese mismo estilo. Puedes reemplazar cada personaje de manera individual.</p>
      <section class="card gm-npc-section">
        <label for="gm-npc-genre">Ambientación</label>
        <select id="gm-npc-genre" bind:value={selectedGmNpcGenre} on:change={changeGmNpcGenre}>
          {#each GM_NPC_GENRES as genre}
            <option value={genre.id}>{genre.label}</option>
          {/each}
        </select>
        <div class="gm-npc-list">
          {#each gmNpcCharacters as npc, index (index)}
            <article class="gm-npc-card">
              <div class="gm-npc-heading">
                <div><small>{GM_NPC_GENRES.find((item) => item.id === selectedGmNpcGenre)?.label} · PNJ {index + 1}</small><h3>{npc.name}</h3></div>
                <button class="secondary gm-npc-reroll" aria-label="Generar otro personaje" title="Generar otro personaje de la misma ambientación" on:click={() => rerollGmNpc(index)}>🎲</button>
              </div>
              <p><strong>Apariencia:</strong> {npc.appearance}</p>
              <p><strong>Personalidad:</strong> {npc.personality}</p>
            </article>
          {/each}
        </div>
      </section>
      <section class="card gm-npc-notes">
        <h3>Notas del narrador</h3>
        <textarea rows="4" bind:value={gmNpcNotes} on:input={saveGmNpcNotes} placeholder="Anota aquí ideas, detalles o información relacionada con estos personajes..."></textarea>
      </section>
    </main>
  {:else if activeTab === 'lineas-velos'}
    <main class="content lines-veils-content">
      <div class="eyebrow">ACUERDOS DE SEGURIDAD DE LA PARTIDA</div>
      <h1>Líneas y velos</h1>
      <p class="notes-intro">Estos acuerdos son compartidos por toda la mesa. Cualquier participante puede leerlos, añadir contenido, modificarlo o borrarlo en cualquier momento.</p>
      <section class="card">
        <h2>Líneas</h2>
        <p>Temas o contenidos que no deben aparecer en la partida. Se excluyen por completo.</p>
        <label for="shared-lines">Límites acordados</label>
        <textarea id="shared-lines" class="shared-safety-text" rows="8" bind:value={linesVeils.lines} on:input={(event) => updateLinesVeils('lines', event.currentTarget.value)} placeholder="Escribe aquí los temas que no deben aparecer en la partida..."></textarea>
      </section>
      <section class="card">
        <h2>Velos</h2>
        <p>Temas que pueden existir en la historia, pero que no se describen en detalle ni se representan directamente. Se dejan fuera de escena.</p>
        <label for="shared-veils">Contenidos que quedan fuera de escena</label>
        <textarea id="shared-veils" class="shared-safety-text" rows="8" bind:value={linesVeils.veils} on:input={(event) => updateLinesVeils('veils', event.currentTarget.value)} placeholder="Escribe aquí los temas que pueden existir, pero deben quedar fuera de escena..."></textarea>
      </section>
      <p class="sync-note">Los cambios se comparten con todos los participantes de la sala y cualquiera puede editarlos o eliminarlos.</p>
    </main>
  {:else if activeTab === 'reglamento'}
    <main class="content rules-content">
      <div class="eyebrow">SISTEMA DE JUEGO</div>
      <h1>Reglamento MIMPROV</h1>
      <p class="rules-intro">Resumen de las reglas para jugadores y narrador. Esta sección es de consulta y no modifica las fichas ni el seguimiento de la partida.</p>

      <section class="card">
        <h2>1. Creación de personajes</h2>
        <p>Cada personaje se define mediante su nombre, arquetipo, concepto, edad, apariencia, cuatro Enfoques, cuatro Rasgos y su equipo. Elige primero el arquetipo y después escribe el concepto.</p>
        <ul>
          <li><strong>Valiente:</strong> Tenacidad 1 e Instinto 1; Peleador y Superviviente.</li>
          <li><strong>Místico:</strong> Disciplina 1 e Instinto 1; Observador y Conocedor de...</li>
          <li><strong>Académico:</strong> Disciplina 1 e Ingenio 1; Investigador y Conocedor de...</li>
          <li><strong>Atlético:</strong> Tenacidad 1 e Instinto 1; Atlético y Superviviente.</li>
          <li><strong>Sociable:</strong> Disciplina 1 e Ingenio 1; Persuasivo y Liderazgo.</li>
          <li><strong>Arquetipo:</strong> aporta 2 puntos de Enfoque, repartidos entre dos Enfoques distintos (1 punto en cada uno), y 2 Rasgos fijos.</li>
          <li><strong>Enfoques:</strong> distribuye los otros 2 puntos entre los Enfoques que no recibieron puntos del arquetipo. Puedes asignar ambos puntos al mismo Enfoque o repartirlos entre dos. Ningún Enfoque puede superar 2 puntos; empiezas con 4 puntos en total.</li>
          <li><strong>Rasgos:</strong> conserva los 2 Rasgos fijos del arquetipo y escoge otros 2 de la lista. Cada Rasgo aporta +1 dado cuando resulta directamente relevante para la acción.</li>
          <li><strong>Equipo:</strong> cada Rasgo proporciona tres espacios de objetos asociados. Debes completar al menos 12 objetos para terminar la creación.</li>
          <li><strong>Voluntad:</strong> comienzas con 4 puntos y tu máximo inicial también es 4.</li>
          <li><strong>Monedas de esfuerzo:</strong> comienzas cada sesión con 3 monedas. El arquetipo y el concepto forman juntos la identidad del personaje: puedes gastar una moneda cuando la acción esté relacionada con el arquetipo o con el concepto. Puedes añadir 1d6 a una tirada o volver a lanzar todos sus dados. Gastar una moneda no genera Estados.</li>
        </ul>
      </section>

      <section class="card">
        <h2>2. Resolución de acciones</h2>
        <p>Cuando una acción tiene un resultado incierto y relevante, el narrador pide una tirada. La reserva se calcula así:</p>
        <div class="rules-formula">Enfoque + Rasgo aplicable − penalización por Estado</div>
        <ul>
          <li><strong>Enfoque:</strong> aporta tantos dados como puntos tengas en el Enfoque elegido.</li>
          <li><strong>Rasgo:</strong> añade 1 dado si el Rasgo es pertinente para la acción.</li>
          <li><strong>Estado:</strong> resta 1 dado cuando el Estado correspondiente afecta al Enfoque utilizado.</li>
          <li><strong>Ventaja:</strong> añade 1 dado a la reserva.</li>
          <li><strong>Desventaja:</strong> resta 1 dado a la reserva.</li>
          <li><strong>Reserva de 0 o menos:</strong> tira 2d6 y conserva el resultado menor.</li>
        </ul>
        <p>En una tirada normal se conserva el dado más alto. Con desventaja también se conserva el más alto de los dados que se tiren.</p>
        <div class="rules-outcomes">
          <div><strong>1–4</strong><span>Fracaso</span></div>
          <div><strong>5</strong><span>Éxito con consecuencia</span></div>
          <div><strong>6</strong><span>Éxito limpio</span></div>
        </div>
        <p>Si en una tirada aparecen dos o más resultados de 6, obtienes un <strong>éxito crítico</strong> y recuperas 1 punto de Voluntad, sin superar tu máximo.</p>
        <p class="muted">Los Estados asignados por el narrador aplican automáticamente −1d6 cuando afectan al Enfoque utilizado. El jugador no puede seleccionar ni añadir Estados manualmente a la tirada.</p>
      </section>

      <section class="card">
        <h2>3. Voluntad</h2>
        <p>La Voluntad representa la capacidad del personaje para sostenerse frente a la presión.</p>
        <ul>
          <li>Comienzas con 4 puntos de Voluntad.</li>
          <li>Un éxito crítico recupera 1 punto, sin superar el máximo.</li>
          <li>Al descansar recuperas 2 puntos, sin superar el máximo.</li>
          <li>Cuando llegas a 0 Voluntad, todas tus tiradas pasan a ser 2d6 conservando el resultado menor, independientemente de la reserva, la ventaja o la desventaja.</li>
        </ul>
      </section>

      <section class="card">
        <h2>4. Estados</h2>
        <p>Los Estados representan condiciones que dificultan determinadas acciones. Cada Estado aplica una penalización de −1 dado al Enfoque asociado.</p>
        <ul>
          <li><strong>Mermado — Instinto:</strong> lesión o limitación física.</li>
          <li><strong>Deprimido — Tenacidad:</strong> enfermedad, intoxicación o debilidad.</li>
          <li><strong>Ansioso — Disciplina:</strong> miedo, terror o intimidación.</li>
          <li><strong>Confundido — Ingenio:</strong> percepción o pensamiento alterados.</li>
          <li><strong>Abrumado:</strong> cuando la Voluntad llega a 0, todas las tiradas se realizan con 2d6 y se conserva el resultado menor, independientemente de la reserva, la ventaja o la desventaja. Este efecto termina al recuperar al menos 1 punto de Voluntad.</li>
        </ul>
        <p>Descansar no elimina Estados. Cada Estado debe resolverse mediante su propio procedimiento; quitar uno no elimina los demás. Abrumado desaparece automáticamente al recuperar al menos 1 punto de Voluntad.</p>
      </section>

      <section class="card">
        <h2>5. Monedas de esfuerzo</h2>
        <p>Cada personaje recibe 3 monedas de esfuerzo al comienzo de cada sesión. Las monedas no gastadas no se acumulan: al iniciar una nueva sesión, todos vuelven a tener 3.</p>
        <ul>
          <li>Solo puedes gastar una moneda si la acción que intentas realizar está relacionada con el arquetipo o el concepto de tu personaje. No necesitas explicar ni justificar el gasto.</li>
          <li>Antes de una tirada, puedes gastar una moneda para añadir 1d6 al pool.</li>
          <li>Después de una tirada, puedes gastar una moneda para volver a lanzar todos los dados, ignorando los Estados o Desventajas que resten dados. Debes aceptar el nuevo resultado.</li>
          <li>Gastar una moneda no genera Estados ni consecuencias automáticas adicionales.</li>
          <li>El descanso no recupera monedas de esfuerzo.</li>
        </ul>
      </section>

      <section class="card">
        <h2>6. Descanso</h2>
        <p>Al realizar un descanso:</p>
        <ul>
          <li>Recuperas 2 puntos de Voluntad, sin superar tu máximo.</li>
          <li>El descanso no recupera monedas de esfuerzo.</li>
          <li>Conservas los Estados que tengas; el descanso no los elimina.</li>
        </ul>
      </section>

      <section class="card">
        <h2>7. Conflictos</h2>
        <p>El narrador puede activar un conflicto. Cuando lo hace, todos los personajes creados quedan involucrados.</p>
        <ul>
          <li>El conflicto tiene un nivel de peligro: <strong>Bajo, Medio o Alto</strong>.</li>
          <li>Cuando un personaje falla una tirada durante el conflicto, pierde Voluntad según el peligro: <strong>Bajo −1, Medio −2, Alto −3</strong>.</li>
          <li>La Resistencia inicial equivale a 2 puntos por cada personaje creado.</li>
          <li>El narrador puede ajustar la Resistencia manualmente. Esta no disminuye automáticamente por los fracasos.</li>
          <li>El narrador administra el nivel de peligro, la Resistencia y los Estados de los personajes.</li>
        </ul>
      </section>

      <section class="card">
        <h2>8. Magia y pactos</h2>
        <p>La magia se resuelve mediante una tirada normal. Truco simple: sin éxitos adicionales; magia moderada: +1 éxito adicional; magia extraordinaria: +2 éxitos adicionales. Estos éxitos solo se suman si la tirada tiene éxito y únicamente cuentan para reducir la Resistencia de un conflicto. No cambian el resultado narrativo ni cuentan para críticos.</p>
        <p>El coste debe ser proporcional al poder y puede consistir en perder Voluntad, recibir Mermado, Deprimido, Ansioso o Confundido, o ambas cosas. Abrumado aparece al llegar a 0 Voluntad. El precio puede pagarse una sola vez al establecer el pacto o cada vez que se utiliza el poder.</p>
      </section>
      <section class="card">
        <h2>9. Dirección de juego</h2>
        <p>El narrador determina cuándo una acción requiere una tirada, qué Enfoque corresponde, si un Rasgo resulta aplicable y qué consecuencias tiene el resultado. Las reglas no establecen rondas, turnos, ataques ni movimientos automáticos: esos elementos se resuelven según la situación y la dirección del narrador.</p>
        <p>Las tiradas se realizan mediante Dice+. La aplicación sincroniza las fichas, la Voluntad, los Estados, las monedas de esfuerzo y el estado del conflicto con la sala de Owlbear Rodeo.</p>
      </section>
    </main>
  {/if}
</div>

<style lang="scss">
  :global(body) { background:#202124; color:#eee; min-width:320px; }
  :global(button), :global(input), :global(textarea), :global(select) { font:inherit; }
  .app-shell { min-height:100vh; background:#202124; color:#eee; }
  .main-tabs { display:flex; gap:2px; background:#141516; padding:0 1rem; position:sticky; top:0; z-index:5; }
  .main-tabs button { border:0; border-bottom:3px solid transparent; background:transparent; color:#aaa; padding:1rem 1.2rem; cursor:pointer; }
  .main-tabs button.active { color:#f2c879; border-bottom-color:#d5a64b; }
  .content { width:min(900px,92%); margin:0 auto; padding:2rem 0 4rem; }
  .magic-content .magic-intro { margin:.3rem 0 1.2rem; line-height:1.7; }
  .notes-intro { margin:.3rem 0 1.2rem; line-height:1.7; }
  .player-notes { min-height:24rem; line-height:1.65; resize:vertical; }
  .shared-safety-text { min-height:12rem; line-height:1.65; resize:vertical; }
  .magic-content .field-hint { display:block; color:#999; text-align:right; font-size:.75rem; margin-top:.3rem; }
  .magic-content textarea { min-height:7rem; line-height:1.55; }
  .magic-message { color:#f2c879; margin:.8rem 0 0; }
  .pact-item { border-top:1px solid #45484c; padding:1rem 0; }
  .pact-item:first-of-type { margin-top:.6rem; }
  .pact-item h3 { margin:.8rem 0 .25rem; }
  .pact-item p, .pact-text { white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.65; }
  .pact-status { display:inline-block; padding:.3rem .6rem; border-radius:4px; font-size:.75rem; font-weight:700; background:#393c40; color:#ddd; }
  .pact-status.pending { background:#514326; color:#f2d18e; }
  .pact-status.accepted { background:#294735; color:#a8e0b6; }
  .pact-status.rejected { background:#4c2d31; color:#f0b2b2; }
  .pact-actions { display:flex; flex-wrap:wrap; gap:.6rem; margin-top:1rem; }
  .rules-content .rules-intro { margin:.2rem 0 1.2rem; }
  .rules-content .card { padding:1.35rem 1.5rem; }
  .rules-content h2 { margin-bottom:.65rem; }
  .rules-content p { line-height:1.65; }
  .rules-content ul { color:#c7c7c7; padding-left:1.35rem; line-height:1.7; }
  .rules-content li { margin:.35rem 0; }
  .rules-content li strong, .rules-content p strong { color:#f1d49d; }
  .rules-formula { margin:1rem 0; padding:.9rem 1rem; border:1px solid #806638; border-radius:6px; background:#202225; color:#f2c879; text-align:center; font-weight:750; }
  .rules-outcomes { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.6rem; margin:1rem 0; }
  .rules-outcomes div { display:flex; flex-direction:column; gap:.25rem; align-items:center; padding:.8rem .4rem; border:1px solid #55595e; border-radius:6px; background:#202225; text-align:center; }
  .rules-outcomes strong { color:#f2c879; font-size:1.35rem; }
  .rules-outcomes span { color:#ccc; font-size:.82rem; }
  h1 { color:#f2c879; margin:.4rem 0 .8rem; font-size:1.8rem; }
  h2 { color:#f2c879; font-size:1.2rem; margin:0 0 1rem; }
  h3 { color:#e8c47f; font-size:1rem; }
  p { line-height:1.5; color:#c7c7c7; }
  .eyebrow { color:#c19a54; letter-spacing:.13em; font-size:.72rem; font-weight:700; }
  .card { background:#292b2e; border:1px solid #44474b; border-radius:9px; padding:1.2rem; margin:1rem 0; }
  label { display:block; color:#ddd; margin:1rem 0; font-size:.9rem; }
  input, textarea, select { box-sizing:border-box; display:block; width:100%; margin-top:.4rem; padding:.7rem .75rem; border-radius:5px; border:1px solid #55595e; background:#1e2022; color:#f4f4f4; }
  textarea { resize:vertical; }
  button { background:#bd9143; border:1px solid #d2a954; color:#171717; padding:.65rem 1rem; border-radius:5px; font-weight:650; cursor:pointer; }
  button:disabled { opacity:.35; cursor:not-allowed; }
  button.secondary { background:#373a3e; color:#eee; border-color:#55595e; }
  button.remove { background:transparent; color:#d9a4a4; border:0; padding:.3rem .6rem; }
  .progress { height:5px; background:#444; border-radius:4px; margin:1rem 0 1.8rem; overflow:hidden; }
  .progress span { display:block; height:100%; background:#d3a34d; transition:width .2s; }
  .wizard-actions { display:flex; justify-content:flex-end; gap:.6rem; margin-top:1.5rem; }
  .approach-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.8rem 0; border-bottom:1px solid #414448; }
  .approach-row small { display:block; color:#aaa; margin-top:.25rem; line-height:1.45; }
  .trait-description { align-items:flex-start; }
  .trait-description > div { flex:1; }
  .trait-description small { display:block; color:#aaa; margin-top:.2rem; }
  .trait-description p { margin:.35rem 0 .5rem; font-size:.85rem; }
  .trait-line strong { display:block; color:#eee; }
  .trait-line small { display:block; color:#aaa; margin-top:.2rem; }
  .trait-line p { margin:.25rem 0 .1rem; font-size:.82rem; }
  .stepper { display:flex; align-items:center; gap:.8rem; }
  .stepper button, .will-controls button { width:2rem; height:2rem; padding:0; font-size:1.1rem; }
  .stepper b { min-width:1rem; text-align:center; }
  .total-points { margin-top:1rem; color:#e1a5a5; font-weight:650; }
  .total-points.valid { color:#9bc99b; }
  .trait-picker { display:grid; grid-template-columns:1fr auto; gap:.5rem; align-items:end; }
  .name-generator { display:grid; grid-template-columns:1fr 1fr auto; gap:.55rem; align-items:end; margin:.2rem 0 .6rem; }
  .concept-generator { grid-template-columns:1fr auto; }
  .name-generator label { margin:.5rem 0; }
  .name-dice { min-height:2.65rem; white-space:nowrap; }
  .appearance-options { display:grid; gap:.45rem; max-height:18rem; overflow-y:auto; margin:.8rem 0 1rem; padding:.7rem; border:1px solid #484b50; border-radius:6px; background:#202225; }
  .appearance-options > strong { color:#e8c47f; font-size:.88rem; }
  .appearance-options button { width:100%; text-align:left; white-space:normal; line-height:1.4; background:#303338; color:#ddd; border-color:#55595e; font-weight:450; }
  .appearance-options button.chosen { background:#514126; border-color:#d8b66f; color:#fff0c9; }
  @media(max-width:600px) { .name-generator { grid-template-columns:1fr 1fr; } .concept-generator { grid-template-columns:1fr; } .name-dice { grid-column:1 / -1; } }
  .trait-picker select { grid-column:1; }
  .trait-picker input { grid-column:1; }
  .trait-picker button { grid-column:2; grid-row:1; }
  .selected-item, .inventory-row { display:flex; align-items:center; justify-content:space-between; gap:.5rem; border-bottom:1px solid #414448; padding:.35rem 0; }
  .equipment-group { padding:.2rem 0 .8rem; border-bottom:1px solid #444; }
  .equipment-group h3 { margin-bottom:.2rem; }
  .inline-label { margin:.45rem 0; }
  .inline-label input { margin:0; }
  .inventory-row input { flex:1; }
  .summary { background:#202225; border-radius:6px; padding:1rem; }
  .summary h3 { margin-bottom:.2rem; }
  .sheet-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.2rem; }
  .sheet-title-group { display:flex; align-items:center; gap:1rem; min-width:0; }
  .sheet-title { min-width:0; }
  .sheet-title h1 { overflow-wrap:anywhere; }
  .character-portrait-wrap { flex:0 0 112px; }
  .character-portrait { display:block; width:112px; height:112px; object-fit:cover; border-radius:9px; border:1px solid #806638; background:#202225; }
  .character-portrait-empty { display:grid; place-items:center; color:#806638; font-size:2.2rem; font-weight:700; }
  .portrait-actions { display:flex; align-items:center; flex-wrap:wrap; gap:.5rem; margin-top:.5rem; }
  .portrait-actions small { color:#999; font-size:.75rem; }
  .portrait-upload { margin:0; }
  .gm-player-identity { display:flex; align-items:center; gap:.8rem; min-width:0; }
  .gm-player-portrait { width:52px; height:52px; object-fit:cover; border-radius:6px; border:1px solid #806638; }
  .sheet-header-actions { display:flex; flex-wrap:wrap; gap:.5rem; }
  button.danger-button { background:#4b292d; border-color:#9b555d; color:#ffd7d7; }
  .conflict-result { padding:.8rem 1rem; border:1px solid #8b713e; border-radius:6px; background:#30291d; color:#f2d18e; font-weight:650; }
  .sheet-header h1 { font-size:2rem; }
  .sheet-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
  .export-actions, .modifier-options { display:flex; flex-wrap:wrap; gap:.5rem; }
  .import-button { display:inline-flex; align-items:center; margin:0; padding:.65rem 1rem; border:1px solid #55595e; border-radius:5px; background:#373a3e; color:#eee; cursor:pointer; font-weight:650; }
  .import-button input { display:none; }
  .modifier-picker { margin:1rem 0; color:#ddd; }
  .modifier-options { margin-top:.5rem; }
  .modifier-options button.active { background:#6d542b; border-color:#d8b66f; color:#fff; }
  .pool-summary { margin:1rem 0; padding:1rem; border:1px solid #555; border-radius:6px; background:#202225; }
  .pool-summary small { display:block; color:#aaa; }
  .pool-summary strong { display:block; color:#f2c879; font-size:1.5rem; margin:.2rem 0 .7rem; }
  .pool-summary ul { margin:.5rem 0 0; padding-left:1.2rem; color:#bbb; font-size:.85rem; line-height:1.7; }
  .roll-button { width:100%; margin-top:.5rem; font-size:1rem; }
  .roll-button:disabled { opacity:.6; cursor:wait; }
  .error-message { color:#f0a0a0; margin:.7rem 0; }

  .roll-result { border:1px solid #a88443; background:linear-gradient(145deg,#29251d,#222427 65%); }
  .roll-result.failure { border-color:#a65353; background:linear-gradient(145deg,#352123,#222427 70%); }
  .roll-result.consequence { border-color:#b58a43; }
  .roll-result.success, .roll-result.critical { border-color:#548b68; background:linear-gradient(145deg,#1e3027,#222427 70%); }
  .roll-result-heading,.history-heading,.history-meta { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
  .roll-result-heading h2 { margin:.2rem 0 0; font-size:1.55rem; }
  .result-kicker { color:#c5a66a; font-size:.68rem; font-weight:800; letter-spacing:.12em; }
  .result-approach { border:1px solid #555; border-radius:99px; padding:.3rem .7rem; color:#ccc; font-size:.78rem; }
  .result-description { margin:.65rem 0; color:#e2d7c4; line-height:1.55; }
  .roll-result.failure .result-description { color:#f0baba; }
  .roll-result.success .result-description,.roll-result.critical .result-description { color:#bce3c7; }
  .critical-reward { color:#bce3c7; font-weight:700; }
  .roll-history { margin-top:1rem; }
  .history-heading { align-items:flex-start; }
  .history-heading h2 { margin:0; }
  .history-heading p { margin:.25rem 0 0; }
  .clear-history { white-space:nowrap; padding:.5rem .7rem; font-size:.78rem; }
  .clear-history:disabled { opacity:.4; cursor:not-allowed; }
  .history-list { display:grid; gap:.65rem; margin-top:1rem; }
  .history-entry { border-top:1px solid #414448; padding:.7rem 0 .2rem; }
  .history-meta { flex-wrap:wrap; }
  .history-meta strong { color:#e5c47f; }
  .history-meta span,.history-meta time { color:#999; font-size:.76rem; }
  .history-dice { display:flex; align-items:center; flex-wrap:wrap; gap:.35rem; margin-top:.55rem; }
  .small-die { width:1.8rem; height:1.8rem; border-radius:5px; font-size:.95rem; }
  .history-kept { margin-left:.35rem; color:#aaa; font-size:.76rem; }
  .result-thresholds { display:flex; flex-wrap:wrap; gap:.5rem 1rem; border-top:1px solid #414448; margin-top:1rem; padding-top:.8rem; color:#aaa; font-size:.75rem; }
  .result-thresholds b { color:#e2c27d; }

  .dice-results { display:flex; flex-wrap:wrap; gap:.5rem; margin:1rem 0; }
  .die { display:grid; place-items:center; width:2.7rem; height:2.7rem; border:1px solid #777; border-radius:7px; background:#202225; color:#eee; font-size:1.3rem; font-weight:750; }
  .die.kept { border:2px solid #e0b75e; color:#f2c879; background:#514126; }
  .kept-result { color:#ccc; margin:.5rem 0; }
  .kept-result strong { color:#f2c879; font-size:1.5rem; }
  .roll-result h3 { margin:.8rem 0 .2rem; }
  .sheet-grid .card { margin:0; }
  .will-value { font-size:2.6rem; color:#f2c879; font-weight:700; }
  .will-value small { font-size:1rem; color:#aaa; }
  .will-controls { display:flex; gap:.5rem; margin:.5rem 0; }
  .muted, .sync-note { color:#999; font-size:.82rem; }
  .compact { padding:.55rem 0; }
  .compact small { display:block; max-width:26rem; color:#999; font-size:.76rem; margin-top:.2rem; line-height:1.35; }
  .score { color:#f2c879; font-weight:700; font-size:1.2rem; }
  .trait-line, .inventory-line { padding:.45rem 0; border-bottom:1px solid #414448; }
  .inventory-line small { display:block; color:#999; font-size:.72rem; }
  .full { width:100%; margin-top:.7rem; }
  .extra-info { margin:0 0 1rem; }
  .character-states { margin:0 0 1rem; }
  .state-badges { display:flex; flex-wrap:wrap; gap:.5rem; }
  .state-badge { display:inline-block; padding:.4rem .75rem; border:1px solid #9b6262; border-radius:5px; background:#492e32; color:#ffd6d6; font-weight:650; }
  .extra-info p { margin:.4rem 0; }
  .gm-content > h1 { margin-bottom:0; }
  .gm-npc-list { display:grid; gap:.7rem; }
  .gm-npc-card { padding:.9rem; border:1px solid #484b50; border-radius:7px; background:#222427; }
  .gm-npc-heading { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
  .gm-npc-heading small { color:#c19a54; letter-spacing:.08em; text-transform:uppercase; font-size:.7rem; font-weight:700; }
  .gm-npc-heading h3 { margin:.2rem 0 .5rem; }
  .gm-npc-card p { margin:.45rem 0 0; line-height:1.6; }
  .gm-npc-card p strong { color:#e8c47f; }
  .gm-npc-reroll { width:2.6rem; height:2.6rem; padding:0; font-size:1.2rem; }
  .gm-npc-notes h3 { margin:0 0 .6rem; }
  .gm-npc-notes textarea { width:100%; min-height:5.5rem; resize:vertical; box-sizing:border-box; }
  .character-tabs { display:flex; flex-wrap:wrap; gap:.4rem; margin:.8rem 0 1rem; border-bottom:1px solid #444; padding-bottom:.6rem; }
  .character-tabs button { background:#292929; color:#ddd; border:1px solid #555; border-radius:6px; padding:.55rem .8rem; cursor:pointer; }
  .character-tabs button.active { background:#6d542b; border-color:#d8b66f; color:#fff; }
  .gm-player { border-top:1px solid #444; padding:1rem 0; }
  .gm-player-head { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
  .gm-player-head h3 { margin:.1rem 0; }
  .gm-player-head small { color:#999; }
  .gm-stats { display:grid; gap:.4rem; padding:.6rem 0; color:#ccc; font-size:.85rem; }
  .gm-stats b { color:#f1d49d; }
  .gm-player h4 { color:#d8b66f; margin:1.1rem 0 .4rem; }
  .approach-buttons { display:flex; flex-wrap:wrap; gap:.35rem; margin:.5rem 0; }
  .approach-buttons button { font-size:.75rem; padding:.45rem .6rem; }
  .state-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.4rem; }
  .check-row { display:flex; align-items:flex-start; gap:.6rem; margin:.4rem 0; padding:.5rem; background:#222427; border-radius:5px; }
  .check-row input { width:auto; margin:.2rem 0 0; }
  .check-row small { display:block; color:#999; margin-top:.2rem; }
  .danger-levels, .resistance-controls { display:flex; flex-wrap:wrap; gap:.5rem; }
  .danger-levels button.active { background:#6d542b; border-color:#d8b66f; color:#fff; }
  .resistance-value { color:#f2c879; font-size:3rem; font-weight:750; margin:.4rem 0; }
  @media(max-width:600px) {
    .sheet-grid, .state-grid { grid-template-columns:1fr; }
    .sheet-header { display:block; } .sheet-title-group { align-items:flex-start; } .character-portrait-wrap { flex-basis:76px; } .character-portrait { width:76px; height:76px; }
    .sheet-header-actions { margin-top:.7rem; }
    .sheet-header button { margin-top:0; }
    .trait-picker { grid-template-columns:1fr; }
    .trait-picker button { grid-column:1; grid-row:auto; }
  }
</style>