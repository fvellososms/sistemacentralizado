import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hasDraftContent, isDraftForProject, getDraftConflict, parseDraft } from "./draft.ts";

const blankActivity = { description: "", location: "" };

describe("RDO Draft Rules", () => {
  it("treats untouched defaults as empty", () => {
    assert.equal(hasDraftContent(null), false);
    assert.equal(
      hasDraftContent({ date: "2026-10-26", ownTeamCount: 0, activities: [blankActivity], contractors: [], photos: [] }),
      false
    );
  });

  it("detects any user-filled field", () => {
    assert.equal(hasDraftContent({ observations: "chuva forte" }), true);
    assert.equal(hasDraftContent({ ownTeamCount: "3" }), true);
    assert.equal(hasDraftContent({ contractors: [{}] }), true);
    assert.equal(hasDraftContent({ activities: [{ description: "", location: "Bloco A" }] }), true);
    assert.equal(hasDraftContent({ nonConformities: [{}] }), true);
    assert.equal(hasDraftContent({ occurrences: [{}] }), true);
    assert.equal(hasDraftContent({ photos: [{}] }), true);
    assert.equal(hasDraftContent({ observations: "   " }), false);
  });

  it("matches drafts to projects, accepting legacy drafts without projectId", () => {
    assert.equal(isDraftForProject({ projectId: 2 }, 2), true);
    assert.equal(isDraftForProject({ projectId: 2 }, 3), false);
    assert.equal(isDraftForProject({}, 3), true);
    assert.equal(isDraftForProject(null, 3), false);
  });

  it("reports conflicts only for drafts with content", () => {
    const draft = { projectId: 1, date: "2026-10-20", observations: "x" };
    assert.equal(getDraftConflict({ ...draft, observations: "" }, { projectId: 2 }), "none");
    assert.equal(getDraftConflict(draft, { projectId: 2 }), "other_project");
    assert.equal(getDraftConflict(draft, { projectId: 1, initialDate: "2026-10-21" }), "other_date");
    assert.equal(getDraftConflict(draft, { projectId: 1, initialDate: "2026-10-20" }), "none");
    assert.equal(getDraftConflict(draft, { projectId: 1 }), "none");
  });

  it("parses raw storage values safely", () => {
    assert.equal(parseDraft(null), null);
    assert.equal(parseDraft("{corrupt"), null);
    assert.equal(parseDraft("42"), null);
    assert.deepEqual(parseDraft('{"date":"2026-10-26"}'), { date: "2026-10-26" });
  });
});
