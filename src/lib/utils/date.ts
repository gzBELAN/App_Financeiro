/** Retorna uma data de calendário local no formato ISO, sem conversão para UTC. */
export function getLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Retorna o mês local no formato YYYY-MM, adequado para filtros financeiros. */
export function getLocalIsoMonth(date = new Date()): string {
  return getLocalIsoDate(date).slice(0, 7);
}