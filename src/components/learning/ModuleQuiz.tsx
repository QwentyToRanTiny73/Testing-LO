import { useState } from 'react';
import type { QuizQuestion } from '../../data/quizzes';

type Phase = 'question' | 'socrates' | 'answer' | 'done';

export default function ModuleQuiz({
  questions,
  moduleId,
  title,
}: {
  questions: QuizQuestion[];
  moduleId?: string;
  title?: string;
}) {
  const filtered = moduleId ? questions.filter(q => q.moduleId === moduleId) : questions;
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('question');
  const [socratesAnswer, setSocratesAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean; question: string }[]>([]);

  const q = filtered[idx];

  function handleSelect(optIdx: number) {
    if (phase !== 'question') return;
    setSelected(optIdx);
    const correct = optIdx === q.correctIndex;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, { correct, question: q.question }]);

    if (q.socratesFollowUp) {
      setPhase('socrates');
    } else {
      setPhase('answer');
    }
  }

  function handleNext() {
    if (idx + 1 >= filtered.length) {
      setPhase('done');
    } else {
      setIdx(i => i + 1);
      setSelected(null);
      setPhase('question');
      setSocratesAnswer('');
    }
  }

  function restart() {
    setIdx(0);
    setSelected(null);
    setPhase('question');
    setSocratesAnswer('');
    setScore(0);
    setAnswers([]);
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        Вопросы для этого раздела ещё не добавлены.
      </div>
    );
  }

  if (phase === 'done') {
    const pct = Math.round((score / filtered.length) * 100);
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '📚' : '🔄'}</div>
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-1">
            {pct >= 80 ? 'Отлично!' : pct >= 50 ? 'Хороший результат' : 'Нужно повторить'}
          </h3>
          <div className="text-3xl font-bold text-wine-700 dark:text-wine-400">{score}/{filtered.length}</div>
          <div className="text-stone-500 dark:text-stone-400">{pct}% правильных ответов</div>
        </div>

        <div className="space-y-2">
          {answers.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm
              ${a.correct
                ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300'}`}>
              <span className="flex-shrink-0 text-base">{a.correct ? '✓' : '✗'}</span>
              <span className="line-clamp-2">{a.question}</span>
            </div>
          ))}
        </div>

        <button onClick={restart} className="btn-primary w-full justify-center">
          Пройти заново
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>Вопрос {idx + 1} / {filtered.length}</span>
        <div className="flex gap-1">
          {filtered.map((_, i) => (
            <div key={i} className={`h-2 w-6 rounded-full transition-colors
              ${i < idx ? 'bg-green-400' : i === idx ? 'bg-wine-500' : 'bg-stone-200 dark:bg-stone-700'}`} />
          ))}
        </div>
      </div>

      {/* Difficulty badge */}
      <div className="flex gap-2 items-center">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {q.difficulty === 'easy' ? 'лёгкий' : q.difficulty === 'medium' ? 'средний' : 'сложный'}
        </span>
      </div>

      {/* Question */}
      <div className="rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
        <p className="font-semibold text-stone-800 dark:text-stone-200 leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      {phase === 'question' && (
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="w-full text-left p-4 rounded-xl border-2 text-sm font-medium transition-all
                border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300
                hover:border-wine-400 hover:bg-wine-50 dark:hover:bg-wine-950/20 dark:hover:border-wine-600"
            >
              <span className="font-bold mr-2 text-stone-400">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Socrates follow-up */}
      {phase === 'socrates' && q.socratesFollowUp && (
        <div className="space-y-3">
          <div className="rounded-xl border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/20 p-4">
            <div className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              🤔 Метод Сократа: подумайте глубже
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400">{q.socratesFollowUp}</p>
          </div>
          <textarea
            value={socratesAnswer}
            onChange={e => setSocratesAnswer(e.target.value)}
            placeholder="Запишите свои мысли... (не оценивается, только для размышления)"
            className="input h-24 resize-none text-sm"
          />
          <button onClick={() => setPhase('answer')} className="btn-primary">
            Увидеть объяснение
          </button>
        </div>
      )}

      {/* Answer reveal */}
      {phase === 'answer' && (
        <div className="space-y-3">
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-sm
                  ${i === q.correctIndex
                    ? 'border-green-400 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300'
                    : i === selected && i !== q.correctIndex
                    ? 'border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                    : 'border-stone-100 dark:border-stone-800 text-stone-500 dark:text-stone-500'}`}
              >
                <span className="text-lg flex-shrink-0">
                  {i === q.correctIndex ? '✓' : i === selected && i !== q.correctIndex ? '✗' : '·'}
                </span>
                <span>{opt}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Объяснение
            </div>
            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{q.explanation}</p>
          </div>

          <button onClick={handleNext} className="btn-primary w-full justify-center">
            {idx + 1 >= filtered.length ? 'Завершить' : 'Следующий вопрос →'}
          </button>
        </div>
      )}
    </div>
  );
}
