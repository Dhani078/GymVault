/**
 * Konversi total volume workout (kg) ke perbandingan benda nyata yang relatable.
 * Dipakai di LoggerScreen untuk motivasi post-workout.
 */
export function getVolumeComparison(vol) {
  if (vol === 0) return '';
  if (vol < 500) return 'Setara mengangkat 2 ekor Panda dewasa 🐼';
  if (vol < 1000) return 'Setara mengangkat motor gede Harley Davidson 🏍️';
  if (vol < 2000) return 'Setara mengangkat 1 ekor sapi limosin premium 🐂';
  if (vol < 3500) return 'Setara mengangkat mobil keluarga Avanza 🚗';
  if (vol < 5000) return 'Setara mengangkat mobil SUV Fortuner Gagah 🚙';
  if (vol < 8000) return 'Setara mengangkat mobil listrik Tesla Model X ⚡';
  return 'Setara mengangkat helikopter tempur Apache 🚁';
}
