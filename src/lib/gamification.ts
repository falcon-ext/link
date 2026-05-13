export const XP_PER_DAY = 30;

// XP necessário para ir do nível N para N+1: começa em 30, aumenta 15 por nível
export function xpForNextLevel(level: number): number {
  return 30 + (level - 1) * 15;
}

// activeDays = número de dias únicos em que qualquer treino foi concluído
export function getLevelInfo(activeDays: number) {
  const totalXP = activeDays * XP_PER_DAY;
  let level = 1;
  let xpAccumulated = 0;
  while (true) {
    const needed = xpForNextLevel(level);
    if (xpAccumulated + needed > totalXP) break;
    xpAccumulated += needed;
    level++;
  }
  const currentXP = totalXP - xpAccumulated;
  const nextLevelXP = xpForNextLevel(level);
  return { level, currentXP, nextLevelXP, totalXP };
}

export function getLevelTitle(level: number): string {
  if (level < 5) return 'Iniciante';
  if (level < 10) return 'Guerreiro';
  if (level < 20) return 'Veterano';
  if (level < 35) return 'Elite';
  return 'Lenda';
}

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_workout', title: 'Primeiro Passo',    description: 'Complete seu primeiro treino',      icon: 'footsteps-outline' },
  { id: 'workouts_5',    title: 'Aquecendo',          description: '5 treinos concluídos',              icon: 'flame-outline'     },
  { id: 'workouts_10',   title: 'Consistente',        description: '10 treinos concluídos',             icon: 'medal-outline'     },
  { id: 'workouts_25',   title: 'Dedicado',           description: '25 treinos concluídos',             icon: 'barbell-outline'   },
  { id: 'workouts_50',   title: 'Atleta',             description: '50 treinos concluídos',             icon: 'trophy-outline'    },
  { id: 'workouts_100',  title: 'Lenda',              description: '100 treinos concluídos',            icon: 'star-outline'      },
  { id: 'streak_3',      title: '3 em Sequência',     description: '3 dias consecutivos treinando',     icon: 'flash-outline'     },
  { id: 'streak_7',      title: 'Semana de Fogo',     description: '7 dias consecutivos treinando',     icon: 'ribbon-outline'    },
  { id: 'week_4',        title: 'Semana Cheia',       description: '4 treinos em uma semana',           icon: 'calendar-outline'  },
  { id: 'month_12',      title: 'Mês Ativo',          description: '12 treinos em um mês',              icon: 'fitness-outline'   },
];

export type WorkoutLogMinimal = { finished_at: string };

export function computeStats(logs: WorkoutLogMinimal[]) {
  const totalWorkouts = logs.length;

  // Dias únicos treinados (YYYY-MM-DD), ordenados
  const days = [...new Set(logs.map((l) => l.finished_at.split('T')[0]))].sort();
  const activeDays = days.length;

  // Sequência máxima de dias consecutivos
  let maxStreak = days.length > 0 ? 1 : 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 1;
    }
  }

  // Máximo de treinos em uma semana (domingo a sábado)
  const weekCounts: Record<string, number> = {};
  for (const log of logs) {
    const date = new Date(log.finished_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weekCounts[key] = (weekCounts[key] ?? 0) + 1;
  }
  const weeklyMax =
    Object.values(weekCounts).length > 0 ? Math.max(...Object.values(weekCounts)) : 0;

  // Máximo de treinos em um mês
  const monthCounts: Record<string, number> = {};
  for (const log of logs) {
    const date = new Date(log.finished_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthCounts[key] = (monthCounts[key] ?? 0) + 1;
  }
  const monthlyMax =
    Object.values(monthCounts).length > 0 ? Math.max(...Object.values(monthCounts)) : 0;

  return { totalWorkouts, activeDays, maxStreak, weeklyMax, monthlyMax };
}

export function checkAchievements(stats: ReturnType<typeof computeStats>): Set<string> {
  const { totalWorkouts, maxStreak, weeklyMax, monthlyMax } = stats;
  const unlocked = new Set<string>();
  if (totalWorkouts >= 1)   unlocked.add('first_workout');
  if (totalWorkouts >= 5)   unlocked.add('workouts_5');
  if (totalWorkouts >= 10)  unlocked.add('workouts_10');
  if (totalWorkouts >= 25)  unlocked.add('workouts_25');
  if (totalWorkouts >= 50)  unlocked.add('workouts_50');
  if (totalWorkouts >= 100) unlocked.add('workouts_100');
  if (maxStreak >= 3)       unlocked.add('streak_3');
  if (maxStreak >= 7)       unlocked.add('streak_7');
  if (weeklyMax >= 4)       unlocked.add('week_4');
  if (monthlyMax >= 12)     unlocked.add('month_12');
  return unlocked;
}
