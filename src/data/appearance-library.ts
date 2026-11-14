export type AppearanceAge = 'child' | 'teen' | 'young' | 'adult' | 'older';
export type AppearanceGender = 'male' | 'female';

const DATA: Record<AppearanceAge, { person: Record<AppearanceGender, string>; face: string[]; hair: string[]; build: string[]; bearing: string[] }> = {
  "child": {
    "person": {
      "male": "niño",
      "female": "niña"
    },
    "face": [
      "rostro redondeado y mejillas llenas",
      "cara pequeña y pecas dispersas",
      "facciones suaves y ojos grandes",
      "rostro alargado y expresión curiosa",
      "cara ancha y cejas marcadas"
    ],
    "hair": [
      "cabello corto y despeinado",
      "pelo liso que cae sobre la frente",
      "cabello rizado y abundante",
      "pelo recogido de forma sencilla",
      "cabello fino y algo rebelde"
    ],
    "build": [
      "complexión pequeña y delgada",
      "cuerpo menudo y apariencia frágil"
    ],
    "bearing": [
      "mirada inquieta y postura vivaz",
      "gestos espontáneos y aspecto desaliñado"
    ]
  },
  "teen": {
    "person": {
      "male": "adolescente",
      "female": "adolescente"
    },
    "face": [
      "rostro juvenil y facciones aún suaves",
      "cara alargada con algunas pecas",
      "mandíbula marcada y expresión seria",
      "mejillas ligeramente hundidas y ojos vivos",
      "rostro anguloso y cejas pobladas"
    ],
    "hair": [
      "cabello corto y revuelto",
      "pelo largo y liso",
      "cabello rizado y voluminoso",
      "flequillo irregular sobre la frente",
      "pelo recogido sin demasiado cuidado"
    ],
    "build": [
      "complexión delgada y extremidades largas",
      "figura ligera y aspecto todavía juvenil"
    ],
    "bearing": [
      "postura algo encorvada y mirada desafiante",
      "gestos nerviosos y expresión curiosa"
    ]
  },
  "young": {
    "person": {
      "male": "hombre joven",
      "female": "mujer joven"
    },
    "face": [
      "rostro ovalado y facciones definidas",
      "cara angulosa y pómulos visibles",
      "rostro ancho y mandíbula marcada",
      "facciones delicadas y ojos expresivos",
      "cara alargada con nariz prominente"
    ],
    "hair": [
      "cabello corto y bien cuidado",
      "pelo largo y ligeramente ondulado",
      "cabello rizado y abundante",
      "pelo rapado a los lados",
      "cabello desordenado y mechones sueltos"
    ],
    "build": [
      "complexión delgada y figura esbelta",
      "cuerpo robusto y hombros anchos"
    ],
    "bearing": [
      "postura segura y mirada directa",
      "andar relajado y expresión despreocupada"
    ]
  },
  "adult": {
    "person": {
      "male": "hombre adulto",
      "female": "mujer adulta"
    },
    "face": [
      "rostro ancho y facciones marcadas",
      "cara ovalada con líneas de expresión",
      "mandíbula prominente y nariz aguileña",
      "pómulos altos y mirada cansada",
      "rostro redondeado y cejas espesas"
    ],
    "hair": [
      "cabello corto con algunas canas",
      "pelo largo recogido",
      "cabello rizado y algo descuidado",
      "pelo muy corto y entradas visibles",
      "cabello abundante peinado hacia atrás"
    ],
    "build": [
      "complexión corpulenta y brazos fuertes",
      "figura delgada y hombros estrechos"
    ],
    "bearing": [
      "postura firme y expresión reservada",
      "gestos pausados y mirada observadora"
    ]
  },
  "older": {
    "person": {
      "male": "hombre mayor",
      "female": "mujer mayor"
    },
    "face": [
      "rostro surcado de arrugas y pómulos marcados",
      "cara redondeada con arrugas alrededor de los ojos",
      "facciones angulosas y mirada profunda",
      "rostro delgado y mejillas hundidas",
      "cara ancha con líneas de expresión muy visibles"
    ],
    "hair": [
      "cabello blanco y corto",
      "pelo gris y algo desordenado",
      "cabello escaso y entradas pronunciadas",
      "pelo largo completamente canoso",
      "cabello plateado cuidadosamente peinado"
    ],
    "build": [
      "complexión delgada y movimientos cautelosos",
      "cuerpo robusto y espalda ligeramente encorvada"
    ],
    "bearing": [
      "postura encorvada y mirada serena",
      "andar lento y expresión severa"
    ]
  }
};

export const APPEARANCE_AGES: { value: AppearanceAge; label: string }[] = [
  {
    "value": "child",
    "label": "Niño/a (6–12 años)"
  },
  {
    "value": "teen",
    "label": "Adolescente (13–17 años)"
  },
  {
    "value": "young",
    "label": "Joven (18–30 años)"
  },
  {
    "value": "adult",
    "label": "Adulto (31–59 años)"
  },
  {
    "value": "older",
    "label": "Persona mayor (60 años o más)"
  }
];

export function getAppearanceOptions(age: AppearanceAge, gender: AppearanceGender): string[] {
  const data = DATA[age] || DATA.adult;
  const person = data.person[gender] || data.person.male;
  const results: string[] = [];
  const impressions = ['de aspecto atractivo y facciones armoniosas', 'de rasgos poco agraciados y aspecto corriente', 'de apariencia llamativa y difícil de olvidar', 'de aspecto común, sin rasgos especialmente destacados', 'de facciones toscas y aspecto descuidado'];
  for (let i = 0; i < data.face.length; i++) {
    for (let j = 0; j < data.hair.length; j++) {
      const build = data.build[(i + j) % data.build.length];
      const bearing = data.bearing[(i * 2 + j) % data.bearing.length];
      results.push(`${gender === 'female' ? 'Una' : 'Un'} ${person} de ${data.face[i]}, ${data.hair[j]}, ${build}, ${bearing} y ${impressions[(i + j) % impressions.length]}.`);
    }
  }
  return results.slice(0, 25);
}
