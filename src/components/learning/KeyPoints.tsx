export default function KeyPoints({
  points,
  mnemonic,
  selfCheck,
}: {
  points: string[];
  mnemonic?: string;
  selfCheck?: string[];
}) {
  return (
    <div className="space-y-4 mt-8 not-prose">
      {/* Key points */}
      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🎯</span>
          <h3 className="font-semibold text-green-800 dark:text-green-300">Ключевые выводы</h3>
        </div>
        <ul className="space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-green-800 dark:text-green-300">
              <span className="flex-shrink-0 font-bold">{i + 1}.</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mnemonic */}
      {mnemonic && (
        <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧠</span>
            <h3 className="font-semibold text-purple-800 dark:text-purple-300">Мнемоника для запоминания</h3>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-400 italic">{mnemonic}</p>
        </div>
      )}

      {/* Self-check */}
      {selfCheck && selfCheck.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">❓</span>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Проверь себя</h3>
          </div>
          <ul className="space-y-2">
            {selfCheck.map((q, i) => (
              <li key={i} className="text-sm text-blue-700 dark:text-blue-400 flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
