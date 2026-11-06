import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  activitiesToCsv,
  distinctValues,
  filterActivities,
  groupQuantities,
  isIsoDate,
  normalizeActivity,
  statusLabel,
  summarizeActivities,
  todayInSaoPaulo,
  upcomingVisits,
  validateActivity,
  weeklyTrend,
  type ActivityInput,
  type ActivityRecord,
} from "./activities.ts";

const TODAY = "2026-11-05";

const manual: ActivityInput = {
  occurredOn: "2026-10-20",
  company: "  PETMAX ",
  collaboratorId: 3,
  collaborator: "Ana Costa",
  category: "Revisões",
  quantity: 2,
  status: "completed",
  notes: "  PGR revisado ",
};

const visita: ActivityInput = {
  occurredOn: "2026-11-04",
  company: "Hotel Marina",
  collaboratorId: 3,
  collaborator: "Ana Costa",
  visitType: "inspecao",
  objective: "Inspeção de andaimes da fachada",
  status: "realizada",
  projectId: 9901,
  projectName: "Hotel Marina",
  notes: "Andaimes liberados",
};

const eso: ActivityInput = {
  externalId: "eso-1",
  occurredOn: "2026-10-21",
  company: "Grupo CTV",
  collaborator: "Bruno Lima",
  category: "Eventos eSocial",
  eventCode: "S-2240",
  quantity: 10,
  submittedQuantity: 8,
  status: "pending",
};

const record = (over: Partial<ActivityRecord>): ActivityRecord => ({
  ...normalizeActivity(manual, "manual"),
  ...over,
});

describe("Workspace Activity Rules", () => {
  it("validates calendar dates strictly", () => {
    assert.equal(isIsoDate("2026-02-28"), true);
    assert.equal(isIsoDate("2026-02-30"), false);
    assert.equal(isIsoDate("28/02/2026"), false);
  });

  it("formats today in the São Paulo time zone", () => {
    assert.equal(todayInSaoPaulo(new Date("2026-11-05T01:30:00Z")), "2026-11-04");
  });

  it("accepts complete visits, manual activities and ESO records", () => {
    assert.deepEqual(validateActivity(visita, "visita", TODAY), { isValid: true, errors: {} });
    assert.deepEqual(validateActivity(manual, "manual"), { isValid: true, errors: {} });
    assert.deepEqual(validateActivity(eso, "eso"), { isValid: true, errors: {} });
  });

  it("requires a system user for visits and manual activities", () => {
    assert.ok(validateActivity({ ...manual, collaboratorId: undefined }, "manual").errors.collaboratorId);
    assert.ok(validateActivity({ ...visita, collaboratorId: 0 }, "visita").errors.collaboratorId);
    assert.ok(validateActivity({ ...eso, collaborator: " " }, "eso").errors.collaborator);
  });

  it("validates visit type, objective, status and date", () => {
    const { errors } = validateActivity({ ...visita, visitType: "outra" as never, objective: "x", status: "completed" as never }, "visita", TODAY);
    assert.ok(errors.visitType && errors.objective && errors.status);
    assert.match(validateActivity({ ...visita, occurredOn: "2026-11-10" }, "visita", TODAY).errors.status!, /futura/);
    assert.equal(validateActivity({ ...visita, occurredOn: "2026-11-10", status: "agendada" }, "visita", TODAY).isValid, true);
  });

  it("restricts manual categories and quantity range", () => {
    const { errors } = validateActivity({ ...manual, category: "Eventos eSocial", quantity: 0 }, "manual");
    assert.ok(errors.category);
    assert.ok(errors.quantity);
  });

  it("checks ESO event code, submitted total and external id", () => {
    const { errors } = validateActivity({ ...eso, eventCode: "S-1000", submittedQuantity: 11, externalId: " " }, "eso");
    assert.ok(errors.eventCode && errors.submittedQuantity && errors.externalId);
  });

  it("normalizes each source keeping only its fields", () => {
    const m = normalizeActivity({ ...manual, eventCode: "S-2240", externalId: "x", submittedQuantity: 5 }, "manual");
    assert.equal(m.company, "PETMAX");
    assert.equal(m.notes, "PGR revisado");
    assert.equal(m.eventCode, null);
    assert.equal(m.externalId, null);
    assert.equal(m.submittedQuantity, 0);
    assert.equal(m.visitType, null);

    const v = normalizeActivity({ ...visita, quantity: 9 }, "visita");
    assert.equal(v.quantity, 1);
    assert.equal(v.category, "Inspeção de segurança");
    assert.equal(v.projectId, 9901);
    assert.equal(v.collaboratorId, 3);
  });

  it("filters by period, company, collaborator, source and search text", () => {
    const rows = [
      record({ occurredOn: "2026-10-01", company: "A", collaborator: "Ana" }),
      record({ occurredOn: "2026-10-10", company: "B", collaborator: "Bruno", source: "eso", notes: "Laudo" }),
      record({ occurredOn: "2026-10-20", company: "A", collaborator: "Bruno", source: "visita", objective: "Andaimes" }),
    ];
    assert.equal(filterActivities(rows, { from: "2026-10-05", to: "2026-10-15" }).length, 1);
    assert.equal(filterActivities(rows, { company: "A", collaborator: "Bruno" }).length, 1);
    assert.equal(filterActivities(rows, { source: "eso" }).length, 1);
    assert.equal(filterActivities(rows, { search: "andaimes" }).length, 1);
  });

  it("summarizes visits carried out and scheduled, ESO events and manual units", () => {
    const rows = [
      record({ source: "visita", quantity: 1, status: "realizada" }),
      record({ source: "visita", quantity: 1, status: "agendada" }),
      record({ source: "visita", quantity: 1, status: "cancelada" }),
      record({ source: "eso", quantity: 10, submittedQuantity: 8 }),
      record({ source: "eso", quantity: 10, submittedQuantity: 5 }),
      record({ source: "manual", quantity: 3 }),
    ];
    assert.deepEqual(summarizeActivities(rows), { visits: 1, scheduledVisits: 1, informed: 20, submitted: 13, manual: 3, sendRate: 65 });
    assert.equal(summarizeActivities([]).sendRate, null);
  });

  it("groups quantities ignoring visits not carried out", () => {
    const rows = [
      record({ company: "B", quantity: 1 }),
      record({ company: "A", quantity: 2 }),
      record({ company: "B", quantity: 4 }),
      record({ company: "C", source: "visita", status: "agendada", quantity: 1 }),
    ];
    assert.deepEqual(groupQuantities(rows, "company"), [
      { name: "B", quantity: 5 },
      { name: "A", quantity: 2 },
    ]);
    assert.deepEqual(distinctValues(rows, "company"), ["A", "B", "C"]);
  });

  it("groups the trend by ISO week, counting only visits carried out", () => {
    const rows = [
      record({ occurredOn: "2026-10-19", quantity: 1 }),
      record({ occurredOn: "2026-10-25", quantity: 2 }),
      record({ occurredOn: "2026-10-26", quantity: 4, source: "eso" }),
      record({ occurredOn: "2026-10-26", quantity: 1, source: "visita", status: "realizada" }),
      record({ occurredOn: "2026-10-27", quantity: 1, source: "visita", status: "agendada" }),
    ];
    assert.deepEqual(weeklyTrend(rows), [
      { weekStart: "2026-10-19", visita: 0, eso: 0, manual: 3 },
      { weekStart: "2026-10-26", visita: 1, eso: 4, manual: 0 },
    ]);
  });

  it("lists upcoming scheduled visits, soonest first", () => {
    const rows = [
      record({ source: "visita", status: "agendada", occurredOn: "2026-11-09", collaborator: "Bruno" }),
      record({ source: "visita", status: "agendada", occurredOn: "2026-11-06", collaborator: "Ana" }),
      record({ source: "visita", status: "agendada", occurredOn: "2026-11-01" }),
      record({ source: "visita", status: "realizada", occurredOn: "2026-11-07" }),
    ];
    assert.deepEqual(upcomingVisits(rows, TODAY).map((r) => r.occurredOn), ["2026-11-06", "2026-11-09"]);
  });

  it("exports CSV with labels, quotes and formula escaping", () => {
    const csv = activitiesToCsv([record({ company: '=HYPERLINK("x")', notes: null })]);
    assert.ok(csv.startsWith("﻿\"Data\";"));
    const line = csv.split("\r\n")[1];
    assert.ok(line.includes(`"'=HYPERLINK(""x"")"`));
    assert.ok(line.includes('"Concluído"'));
    assert.ok(line.includes('"Manual"'));
    assert.equal(statusLabel("agendada"), "Agendada");
  });
});
