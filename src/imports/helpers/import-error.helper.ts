/**
 * Every error message of a bulk import, in one place. French, with the Excel
 * line number (doc/notes/bulk-import.md § All or nothing) — the frontend is
 * French and shows them as they are.
 */
export interface ImportError {
  /** The Excel line, 0 = the whole file. */
  row: number;
  field: string | null;
  message: string;
}

const line = (row: number, text: string, field: string | null = null) => ({
  row,
  field,
  message: `Ligne ${row} : ${text}`,
});

export const importErrors = {
  idNotFound: (row: number, id: number) =>
    line(row, `aucun matériau avec l'id ${id}.`, 'id'),
  idArchived: (row: number, id: number, description: string) =>
    line(row, `le matériau « ${description} » (id ${id}) est archivé.`, 'id'),
  idTwice: (row: number, id: number, firstRow: number) =>
    line(
      row,
      `l'id ${id} apparaît deux fois dans le fichier (lignes ${firstRow} et ${row}).`,
      'id',
    ),
  descriptionMismatch: (row: number, id: number, expected: string) =>
    line(
      row,
      `l'id ${id} ne correspond pas à ce nom. Le nom attendu est « ${expected} ».`,
      'description',
    ),
  descriptionTaken: (row: number, description: string) =>
    line(row, `le matériau « ${description} » existe déjà.`, 'description'),
  descriptionTakenArchived: (row: number, description: string) =>
    line(
      row,
      `un matériau archivé s'appelle déjà « ${description} ».`,
      'description',
    ),
  descriptionTwice: (row: number, description: string, firstRow: number) =>
    line(
      row,
      `le matériau « ${description} » apparaît deux fois dans le fichier (lignes ${firstRow} et ${row}).`,
      'description',
    ),
  unitChanged: (row: number, from: string, to: string) =>
    line(
      row,
      `l'unité ne peut pas être changée par import (${from} → ${to}).`,
      'unit',
    ),
  negative: (row: number, field: string, label: string) =>
    line(row, `${label} ne peut pas être négatif.`, field),
  stockDepartOnExisting: (row: number) =>
    line(
      row,
      `le stock de départ est seulement pour un nouveau matériau. Utilisez l'import du stock.`,
      'stock_depart',
    ),
  stockDepartNotPositive: (row: number) =>
    line(row, `le stock de départ doit être plus grand que 0.`, 'stock_depart'),
  purchaseNotPositive: (row: number) =>
    line(
      row,
      `la quantité d'un achat doit être plus grande que 0.`,
      'quantity',
    ),
  adjustmentZero: (row: number) =>
    line(row, `la quantité d'un ajustement ne peut pas être 0.`, 'quantity'),
  adjustmentNoNote: (row: number) =>
    line(row, `une note est obligatoire pour un ajustement.`, 'note'),
  sameTimeConflict: (): ImportError => ({
    row: 0,
    field: null,
    message:
      "Un matériau avec le même nom a été créé pendant l'import. Rien n'a été importé : réessayez.",
  }),
  unexpected: (): ImportError => ({
    row: 0,
    field: null,
    message:
      "L'import a échoué à cause d'une erreur technique. Rien n'a été importé : réessayez.",
  }),
};
