import { STEP_DISPLAY_ORDER } from "@/types/agent";
import type { ChecklistStep, StepChecklist, StepId } from "@/types/agent";

export function upsertChecklistStep(
  checklist: StepChecklist,
  step: { id: string; label: string; status: ChecklistStep["status"] },
): StepChecklist {
  return {
    ...checklist,
    [step.id]: { label: step.label, status: step.status },
  };
}

export function checklistToArray(checklist: StepChecklist): ChecklistStep[] {
  const seen = new Set<string>();
  const ordered: ChecklistStep[] = [];

  for (const id of STEP_DISPLAY_ORDER) {
    const entry = checklist[id];
    if (!entry) {
      continue;
    }
    ordered.push({ id, label: entry.label, status: entry.status });
    seen.add(id);
  }

  for (const id of Object.keys(checklist)) {
    if (seen.has(id)) {
      continue;
    }
    const entry = checklist[id];
    if (entry) {
      ordered.push({ id, label: entry.label, status: entry.status });
    }
  }

  return ordered;
}

export function isKnownStepId(id: string): id is StepId {
  return STEP_DISPLAY_ORDER.includes(id as StepId);
}
