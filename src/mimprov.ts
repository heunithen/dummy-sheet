export type TraitDefinition = {
  name: string;
  description: string;
  equipment: string[];
  optional?: boolean;
};

export const TRAITS: TraitDefinition[] = [
  { name: "Atlético", description: "Preparación física para correr, saltar, trepar, nadar y superar esfuerzos prolongados.", equipment: ["Cuerda", "Guantes de agarre", "Botella de agua"] },
  { name: "Conocedor de...", description: "Formación o experiencia en un campo concreto. Debes definir la especialidad.", equipment: ["Cuaderno de referencia", "Instrumento de medición apropiado", "Kit básico de trabajo relacionado con la especialidad"] },
  { name: "Espadachín", description: "Entrenamiento en combate con armas cuerpo a cuerpo.", equipment: ["Espada", "Escudo", "Vaina"] },
  { name: "Investigador", description: "Investiga, busca información útil, interpreta documentos y relaciona conocimientos.", equipment: ["Cuaderno de notas", "Instrumento de escritura", "Libros o documentos de consulta"] },
  { name: "Furtivo", description: "Desplazarse sin llamar la atención, ocultarse y evitar ser detectado.", equipment: ["Capa con capucha", "Ropa oscura", "Herramientas de apertura sencillas"] },
  { name: "Intimidante", description: "Imponerse mediante amenazas, presión o una actitud dominante.", equipment: ["Vestimenta intimidante", "Insignia o símbolo de autoridad", "Accesorio amenazante"] },
  { name: "Liderazgo", description: "Organizar, coordinar y dirigir a otras personas.", equipment: [] },
  { name: "Maestro Chasquilla", description: "Reparar, construir, modificar o desmontar objetos y mecanismos.", equipment: ["Juego de herramientas manuales", "Alicates", "Cinta métrica"] },
  { name: "Observador", description: "Reparar en detalles, identificar rastros, descubrir objetos ocultos y advertir cambios.", equipment: ["Lupa", "Linterna", "Espejo de inspección"] },
  { name: "Peleador", description: "Combate sin armas: golpear, esquivar, sujetar y defenderse con el propio cuerpo.", equipment: ["Guantes de combate", "Vendas para las manos", "Protector corporal ligero"] },
  { name: "Persuasivo", description: "Negociar, convencer, tranquilizar y conseguir cooperación mediante el diálogo.", equipment: ["Vestimenta apropiada para negociar", "Documento o credencial de presentación", "Objeto de intercambio o cortesía"] },
  { name: "Superviviente", description: "Desenvolverse en entornos hostiles, encontrar recursos y mantenerse con vida.", equipment: [] },
  { name: "Tirador", description: "Apuntar, calcular distancias y acertar a objetivos con armas de proyectiles.", equipment: ["Arco", "Carcaj", "Flechas"] },
  { name: "Arcano", description: "Reconocer manifestaciones mágicas, interpretar símbolos e investigar fenómenos sobrenaturales.", equipment: ["Libro de conocimientos arcanos", "Componentes o materiales mágicos", "Instrumento de escritura o dibujo para símbolos"], optional: true }
];

export const FOCI = [
  { name: "Tenacidad", description: "Imponerse a la situación y seguir adelante pese a la oposición, el dolor o las dificultades." },
  { name: "Control", description: "Actuar con calma y cuidado, procurando mantener la precisión y evitar errores." },
  { name: "Astucia", description: "Buscar otra manera de conseguir lo que se quiere, aprovechando las circunstancias y encontrando soluciones ingeniosas." },
  { name: "Rapidez", description: "Actuar antes de que la situación cambie o alguien pueda reaccionar." }
];

export function makeMimprovSheet(data: {
  name: string; concept: string; age: string; appearance: string; experience: string;
  foci: Record<string, number>; traits: string[]; specialization: string;
}) {
  const chosenTraits = data.traits.map((name) =>
    name === "Conocedor de..." && data.specialization.trim()
      ? `Conocedor de: ${data.specialization.trim()}`
      : name
  );
  const inventory = data.traits.flatMap((name) => {
    const definition = TRAITS.find((trait) => trait.name === name);
    if (!definition) return [];
    return definition.equipment.map((item) => ({ name: item, value: "En inventario" }));
  });
  const unresolved = data.traits.filter((name) => {
    const definition = TRAITS.find((trait) => trait.name === name);
    return definition && definition.equipment.length === 0;
  });
  return {
    id: 1,
    name: "Hoja de personaje",
    notes: "",
    sections: [
      { id: 1, name: "PERSONAJE", stats: [
        { id: 1, name: "Nombre", value: data.name },
        { id: 2, name: "Concepto", value: data.concept },
        { id: 3, name: "Edad", value: data.age || "—" },
        { id: 4, name: "Apariencia", value: data.appearance || "—" },
        { id: 5, name: "Experiencia", value: data.experience || "—" },
        { id: 6, name: "Voluntad", value: "4/4" },
        { id: 7, name: "Sobreesfuerzo", value: "2/2" }
      ]},
      { id: 2, name: "ENFOQUES", stats: FOCI.map((focus, index) => ({ id: index + 1, name: focus.name, value: String(data.foci[focus.name] ?? 0) })) },
      { id: 3, name: "RASGOS", stats: chosenTraits.map((trait, index) => ({ id: index + 1, name: trait, value: "Elegido" })) },
      { id: 4, name: "INVENTARIO", stats: inventory.map((item, index) => ({ id: index + 1, name: item.name, value: item.value })) },
      ...(unresolved.length ? [{ id: 5, name: "EQUIPO POR DEFINIR", stats: unresolved.map((trait, index) => ({ id: index + 1, name: trait, value: "El equipo asociado aún no está definido." })) }] : [])
    ]
  };
}
