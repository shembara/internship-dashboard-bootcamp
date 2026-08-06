import {
  internshipSkills,
  type SkillPointItem,
  type SkillProgressDto,
} from "./types";

export function calculateSkillProgress(
  items: readonly SkillPointItem[],
): SkillProgressDto[] {
  return internshipSkills.map(({ value: skill, label, maxPoints }) => {
    const completedPoints = items.reduce(
      (total, item) =>
        item.completed && item.skills.includes(skill) ? total + item.weight : total,
      0,
    );
    return {
      skill,
      label,
      completedPoints,
      maxPoints,
      totalPoints: maxPoints,
      percentage:
        maxPoints > 0
          ? Math.min(
              100,
              Math.max(0, Math.round((completedPoints / maxPoints) * 100)),
            )
          : 0,
    };
  });
}

export function exceedsSkillPointTargets(items: readonly SkillPointItem[]) {
  return calculateSkillProgress(items).some(
    (skill) => skill.completedPoints > skill.maxPoints,
  );
}
