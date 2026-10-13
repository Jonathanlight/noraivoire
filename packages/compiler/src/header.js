// NoraIvoire — En-tête de propriété apposé sur chaque fichier généré.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

export function header(kind, meta) {
  const lines = [
    `NoraIvoire ${meta.version} — fichier GÉNÉRÉ (${kind}) depuis la spec. Ne pas modifier à la main.`,
    '© 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.',
    'Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.',
  ];
  if (kind === 'css') return `/*!\n * ${lines.join('\n * ')}\n */`;
  return lines.map((l) => `// ${l}`).join('\n');
}
