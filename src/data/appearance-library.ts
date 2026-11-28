export type AppearanceAge = 'child' | 'teen' | 'young' | 'adult' | 'older';
export type AppearanceGender = 'male' | 'female';

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const DATA: Record<AppearanceAge, { person: Record<AppearanceGender, string>; face: string[]; build: string[] }> = {
  child: {
    person: { male: 'niño', female: 'niña' },
    face: ['rostro redondeado y mejillas llenas', 'cara pequeña con algunas pecas', 'facciones suaves y ojos grandes'],
    build: ['complexión pequeña y delgada', 'cuerpo menudo', 'complexión robusta para su edad']
  },
  teen: {
    person: { male: 'adolescente', female: 'adolescente' },
    face: ['rostro juvenil y facciones suaves', 'cara alargada con algunas pecas', 'mandíbula marcada', 'mejillas ligeramente hundidas'],
    build: ['complexión delgada y extremidades largas', 'figura ligera y juvenil', 'complexión robusta', 'estatura baja y cuerpo menudo']
  },
  young: {
    person: { male: 'hombre joven', female: 'mujer joven' },
    face: ['rostro ovalado y facciones definidas', 'cara angulosa y pómulos visibles', 'rostro ancho y mandíbula marcada', 'facciones delicadas y ojos expresivos'],
    build: ['complexión delgada y figura esbelta', 'cuerpo robusto y hombros anchos', 'complexión atlética', 'figura baja y compacta', 'cuerpo alto y delgado']
  },
  adult: {
    person: { male: 'hombre adulto', female: 'mujer adulta' },
    face: ['rostro ancho y facciones marcadas', 'cara ovalada con líneas de expresión', 'mandíbula prominente', 'pómulos altos y mirada cansada'],
    build: ['complexión corpulenta y brazos fuertes', 'figura delgada y hombros estrechos', 'complexión atlética', 'cuerpo bajo y robusto', 'figura alta y esbelta']
  },
  older: {
    person: { male: 'hombre mayor', female: 'mujer mayor' },
    face: ['rostro surcado de arrugas y pómulos marcados', 'cara redondeada con arrugas alrededor de los ojos', 'facciones angulosas y mirada profunda', 'rostro delgado y mejillas hundidas'],
    build: ['complexión delgada y movimientos cautelosos', 'cuerpo robusto y espalda ligeramente encorvada', 'figura alta y huesuda', 'complexión ancha y fuerte']
  }
};

export const APPEARANCE_AGES: { value: AppearanceAge; label: string }[] = [
  { value: 'child', label: 'Niño/a (6–12 años)' },
  { value: 'teen', label: 'Adolescente (13–17 años)' },
  { value: 'young', label: 'Joven (18–30 años)' },
  { value: 'adult', label: 'Adulto (31–59 años)' },
  { value: 'older', label: 'Persona mayor (60 años o más)' }
];

export function getRandomAppearance(age: AppearanceAge, gender: AppearanceGender): string {
  const data = DATA[age] || DATA.adult;
  const person = data.person[gender] || data.person.male;
  const skin = pick(['clara', 'pálida', 'olivácea', 'trigueña', 'morena', 'oscura', 'cobriza']);
  const eyes = pick(['marrones', 'negros', 'avellana', 'ámbar', 'verdes', 'azules', 'grises']);
  const hairColor = pick(['negro', 'castaño oscuro', 'castaño', 'rubio', 'rubio ceniza', 'pelirrojo', 'canoso']);
  const hairStyle = pick(['corto y liso', 'largo y liso', 'ondulado hasta los hombros', 'rizado', 'muy corto', 'recogido en una coleta', 'despeinado', 'trenzado']);
  const face = pick(data.face);
  const build = pick(data.build);
  const impression = pick(['de aspecto agradable y facciones armoniosas', 'de aspecto corriente y poco llamativo', 'de apariencia llamativa', 'de facciones toscas y aspecto descuidado']);
  return `${gender === 'female' ? 'Una' : 'Un'} ${person} de piel ${skin}, ojos ${eyes} y cabello ${hairColor}, ${hairStyle}. Tiene ${face} y ${build}; ${impression}.`;
}
