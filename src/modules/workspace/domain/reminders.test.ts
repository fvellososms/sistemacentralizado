import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addMonths,
  monthGrid,
  normalizeReminder,
  reminderState,
  sortReminders,
  summarizeReminders,
  validateReminder,
  type Reminder,
} from "./reminders.ts";

const r = (id: number, date: string, extra: Partial<Reminder> = {}): Reminder => ({
  id,
  title: `L${id}`,
  date,
  time: null,
  notes: null,
  done: false,
  doneAt: null,
  createdAt: "2026-11-01T00:00:00Z",
  ...extra,
});

describe("Reminder validation", () => {
  it("needs a title and a date; time and notes are optional", () => {
    assert.equal(validateReminder({ title: "Ligar para o cliente", date: "2026-11-15" }).isValid, true);
    assert.equal(validateReminder({ title: "x", date: "2026-11-15", time: "07:30", notes: "obs" }).isValid, true);
    const { errors } = validateReminder({ title: "  ", date: "15/11/2026", time: "25:00" });
    assert.ok(errors.title && errors.date && errors.time);
  });
  it("trims and stores empty optional fields as null", () => {
    assert.deepEqual(normalizeReminder({ title: "  Reunião ", date: "2026-11-15", time: "", notes: "  " }), {
      title: "Reunião",
      date: "2026-11-15",
      time: null,
      notes: null,
    });
  });
});

describe("Reminder state and summary", () => {
  const today = "2026-11-15";
  it("tells late, today, upcoming and done", () => {
    assert.equal(reminderState(r(1, "2026-11-14"), today), "atrasado");
    assert.equal(reminderState(r(2, today), today), "hoje");
    assert.equal(reminderState(r(3, "2026-11-16"), today), "proximo");
    assert.equal(reminderState(r(4, "2026-11-01", { done: true }), today), "feito");
  });
  it("points out only open reminders of today or before, oldest first", () => {
    const s = summarizeReminders([r(1, today), r(2, "2026-11-10"), r(3, "2026-11-20"), r(4, "2026-11-12", { done: true })], today);
    assert.equal(s.atrasados, 1);
    assert.equal(s.hoje, 1);
    assert.deepEqual(s.alertas.map((x) => x.id), [2, 1]);
  });
  it("orders by date, then time, all-day first", () => {
    const list = [r(1, today, { time: "14:00" }), r(2, today), r(3, "2026-11-14", { time: "09:00" }), r(4, today, { time: "08:00" })];
    assert.deepEqual(sortReminders(list).map((x) => x.id), [3, 2, 4, 1]);
  });
});

describe("Month grid", () => {
  it("starts on Sunday and covers the whole month", () => {
    const weeks = monthGrid("2026-11"); // 1 Nov 2026 is a Sunday
    assert.equal(weeks[0][0], "2026-11-01");
    assert.ok(weeks.every((w) => w.length === 7));
    assert.equal(weeks.flat().filter((d) => d.startsWith("2026-11")).length, 30);
    assert.equal(weeks[weeks.length - 1][6], "2026-12-05");
  });
  it("fills the first week with the previous month", () => {
    const weeks = monthGrid("2026-12"); // 1 Dec 2026 is a Tuesday
    assert.deepEqual(weeks[0].slice(0, 3), ["2026-11-29", "2026-11-30", "2026-12-01"]);
  });
  it("moves between months and years", () => {
    assert.equal(addMonths("2026-12", 1), "2027-01");
    assert.equal(addMonths("2026-01", -1), "2025-12");
  });
});
