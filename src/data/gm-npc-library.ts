export type GmNpcGenre = 'fantasy' | 'scifi' | 'horror' | 'modern' | 'postapocalyptic';

export const GM_NPC_GENRES: { id: GmNpcGenre; label: string; nameStyle: string }[] = [
  { id: 'fantasy', label: 'Fantasía', nameStyle: 'fantasy' },
  { id: 'scifi', label: 'Ciencia ficción', nameStyle: 'futuristic' },
  { id: 'horror', label: 'Terror', nameStyle: 'contemporary' },
  { id: 'modern', label: 'Moderno', nameStyle: 'contemporary' },
  { id: 'postapocalyptic', label: 'Postapocalíptico', nameStyle: 'contemporary' }
];

const personalities: Record<GmNpcGenre, string[]> = {
  fantasy: [
    'Reservado y observador; habla poco, pero rara vez pasa algo por alto.',
    'Carismática y sociable; sabe ganarse la confianza de quienes conoce.',
    'Orgulloso y competitivo; le cuesta aceptar que se equivoca.',
    'Paciente y reflexiva; prefiere escuchar antes de tomar una decisión.',
    'Impulsiva y temeraria; suele actuar antes de medir las consecuencias.',
    'Desconfiado y cauteloso; necesita tiempo para confiar en los demás.',
    'Curiosa e inquieta; siente fascinación por lo desconocido.',
    'Serio y disciplinado; valora el orden, la palabra dada y la responsabilidad.',
    'Amable y compasiva; se preocupa por el bienestar de quienes la rodean.',
    'Astuto y persuasivo; suele encontrar la manera de conseguir lo que quiere.'
  ],
  scifi: [
    'Analítico y metódico; confía más en los datos que en las intuiciones.',
    'Sarcástica y directa; utiliza el humor para mantener distancia.',
    'Pragmático y frío; prioriza los resultados por encima de los sentimientos.',
    'Idealista y empática; cree que la tecnología debe mejorar la vida de todos.',
    'Reservada y vigilante; siempre parece estar evaluando su entorno.',
    'Extrovertido y carismático; disfruta conversar y establecer contactos.',
    'Inquieta y curiosa; necesita comprender cómo funciona todo lo que encuentra.',
    'Desconfiado y cínico; supone que toda promesa esconde algún interés.',
    'Paciente y calculadora; rara vez toma decisiones apresuradas.',
    'Temperamental y apasionado; reacciona con intensidad ante las injusticias.'
  ],
  horror: [
    'Nervioso y sobresaltado; le cuesta relajarse incluso en lugares seguros.',
    'Callada y hermética; evita hablar de sí misma y de su pasado.',
    'Obsesivo y minucioso; no puede dejar una pregunta sin respuesta.',
    'Amable y protectora; intenta mantener la calma de quienes la rodean.',
    'Paranoico y desconfiado; interpreta los pequeños detalles como posibles amenazas.',
    'Escéptica y racional; busca explicaciones lógicas para todo.',
    'Impulsivo y temerario; enfrenta el peligro antes de pensar en las consecuencias.',
    'Melancólica y distante; parece cargar con una preocupación constante.',
    'Sereno y pragmático; conserva la compostura incluso bajo presión.',
    'Curiosa y atrevida; se acerca a aquello que los demás prefieren evitar.'
  ],
  modern: [
    'Sociable y espontánea; conversa con facilidad y disfruta conocer gente.',
    'Introvertido y observador; prefiere escuchar y analizar antes de intervenir.',
    'Ambiciosa y competitiva; se esfuerza por destacar en todo lo que hace.',
    'Relajado y despreocupado; rara vez permite que algo le quite el buen humor.',
    'Desconfiada y reservada; protege mucho su vida privada.',
    'Empático y conciliador; intenta comprender las razones de los demás.',
    'Impaciente y temperamental; se irrita cuando las cosas no avanzan.',
    'Metódica y responsable; necesita tener sus asuntos bajo control.',
    'Irónico y mordaz; suele responder con humor ácido.',
    'Idealista y entusiasta; se involucra profundamente en aquello que considera importante.'
  ],
  postapocalyptic: [
    'Cauteloso y desconfiado; nunca baja la guardia ante desconocidos.',
    'Solidaria y protectora; comparte lo poco que tiene con quienes lo necesitan.',
    'Pragmático y austero; evita desperdiciar recursos y palabras.',
    'Voluntariosa y obstinada; no abandona fácilmente una tarea.',
    'Huraño y reservado; prefiere mantenerse lejos de los grupos grandes.',
    'Ingeniosa y adaptable; encuentra soluciones con materiales escasos.',
    'Autoritario y dominante; espera que los demás sigan sus instrucciones.',
    'Paciente y previsora; siempre piensa en lo que podría salir mal.',
    'Optimista y perseverante; se niega a perder la esperanza.',
    'Impulsiva y agresiva; responde a las amenazas con rapidez y dureza.'
  ]
};

export function getRandomGmNpcPersonality(genre: GmNpcGenre): string {
  const options = personalities[genre] || personalities.fantasy;
  return options[Math.floor(Math.random() * options.length)];
}
