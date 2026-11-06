import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  daysBetween,
  deadlineState,
  kanbanLanes,
  normalizeTask,
  stalledTasks,
  summarizeTaskBoard,
  taskStats,
  validateTask,
  type Task,
} from "./tasks.ts";

const TODAY = "2026-11-04";

const task = (over: Partial<Task>): Task => ({
  id: 1,
  title: "Revisar PGR",
  company: "Atlas",
  collaboratorId: 1,
  collaborator: "Ana",
  category: "Revisões",
  stage: "todo",
  dueDate: null,
  notes: null,
  stageChangedAt: "2026-11-01T10:00:00.000Z",
  createdAt: "2026-10-01T10:00:00.000Z",
  ...over,
});

describe("Workspace Task Rules", () => {
  it("accepts a valid task and applies the default category", () => {
    const input = { title: " Revisar PGR ", company: "Atlas", collaboratorId: 4, stage: "todo" as const };
    assert.equal(validateTask(input).isValid, true);
    assert.deepEqual(normalizeTask(input, " Ana "), {
      title: "Revisar PGR",
      company: "Atlas",
      collaboratorId: 4,
      collaborator: "Ana",
      category: "Outras atividades",
      stage: "todo",
      dueDate: null,
      notes: null,
    });
  });

  it("rejects missing texts, unknown stage, category and invalid deadline", () => {
    const { errors } = validateTask({ title: "", stage: "blocked" as never, category: "Outra", dueDate: "2026-13-01" });
    for (const field of ["title", "company", "collaboratorId", "stage", "category", "dueDate"]) {
      assert.ok(field in errors, `missing error for ${field}`);
    }
  });

  it("classifies past deadlines as late or met", () => {
    assert.equal(deadlineState(task({ dueDate: "2026-11-03" }), TODAY), "late");
    assert.equal(deadlineState(task({ dueDate: "2026-11-03", stage: "done" }), TODAY), "met");
    assert.equal(deadlineState(task({ dueDate: TODAY }), TODAY), null);
    assert.equal(deadlineState(task({ dueDate: null }), TODAY), null);
  });

  it("computes stats per group with late count and completion", () => {
    const stats = taskStats(
      [
        task({ collaborator: "Ana", stage: "done" }),
        task({ collaborator: "Ana", stage: "doing", dueDate: "2026-11-01" }),
        task({ collaborator: "Bruno", stage: "todo" }),
      ],
      "collaborator",
      TODAY
    );
    assert.deepEqual(stats[0], { name: "Ana", todo: 0, doing: 1, done: 1, late: 1, total: 2, donePercent: 50 });
    assert.equal(stats[1].name, "Bruno");
  });

  it("lists open tasks idle for at least the given days", () => {
    const stalled = stalledTasks(
      [
        task({ id: 1, stageChangedAt: "2026-10-20T09:00:00.000Z" }),
        task({ id: 2, stageChangedAt: "2026-11-03T09:00:00.000Z" }),
        task({ id: 3, stage: "done", stageChangedAt: "2026-09-01T09:00:00.000Z" }),
      ],
      7,
      TODAY
    );
    assert.deepEqual(stalled.map((t) => [t.id, t.idleDays]), [[1, 15]]);
    assert.equal(daysBetween("2026-10-30", TODAY), 5);
  });

  it("builds one kanban lane per collaborator, filtered by company", () => {
    const tasks = [
      task({ id: 1, collaborator: "Bruno", stage: "doing" }),
      task({ id: 2, collaborator: "Ana", stage: "todo" }),
      task({ id: 3, collaborator: "Ana", stage: "done", company: "Aurora" }),
    ];
    const lanes = kanbanLanes(tasks);
    assert.deepEqual(lanes.map((l) => l.collaborator), ["Ana", "Bruno"]);
    assert.equal(lanes[0].stages.done.length, 1);
    assert.deepEqual(kanbanLanes(tasks, "Aurora").map((l) => l.collaborator), ["Ana"]);
  });

  it("summarizes the board for the menu badge and the overview", () => {
    const summary = summarizeTaskBoard(
      [
        task({ id: 1, stage: "todo", dueDate: "2026-11-01", stageChangedAt: "2026-10-01T10:00:00.000Z" }),
        task({ id: 2, stage: "doing", dueDate: "2026-11-10", stageChangedAt: "2026-11-03T10:00:00.000Z" }),
        task({ id: 3, stage: "done", dueDate: "2026-10-01" }),
      ],
      TODAY
    );
    assert.deepEqual(summary, { total: 3, open: 2, late: 1, stalled: 1, done: 1 });
    assert.equal(summarizeTaskBoard([], TODAY).late, 0);
  });
});
