import { archetypes, type ArchetypeId, type Scores } from "../data/quiz.ts";
export type AnswerScores = {
  questionId: string;
  answerId: string;
  scores: Partial<Scores>;
};
const tieOrder: ArchetypeId[] = ["hearth", "tidepool", "lantern"];
export function scoreQuiz(answers: AnswerScores[]): ArchetypeId {
  const totals: Scores = { hearth: 0, lantern: 0, tidepool: 0 };
  for (const answer of answers)
    for (const id of Object.keys(archetypes) as ArchetypeId[]) {
      const points = answer.scores[id];
      if (typeof points === "number" && Number.isFinite(points) && points > 0)
        totals[id] += points;
    }
  return tieOrder.reduce((winner, candidate) =>
    totals[candidate] > totals[winner] ? candidate : winner,
  );
}
