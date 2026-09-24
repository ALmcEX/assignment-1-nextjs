import { describe, expect, it } from "vitest";
import { getCourses, parseCourses } from "./courses";

function fakeClient(result: { data: unknown; error: unknown }) {
  const calls: unknown[] = [];
  const query = {
    select(columns: string) {
      calls.push(["select", columns]);
      return query;
    },
    order(column: string, options: { ascending: boolean }) {
      calls.push(["order", column, options]);
      return Promise.resolve(result);
    },
  };

  return {
    calls,
    client: {
      from(table: string) {
        calls.push(["from", table]);
        return query;
      },
    },
  };
}

describe("parseCourses", () => {
  it("accepts valid course rows", () => {
    expect(
      parseCourses([
        { id: 1, name: "Design for AI", instructor: "Jane Doe", semester: "Fall 2026" },
      ]),
    ).toEqual([
      { id: 1, name: "Design for AI", instructor: "Jane Doe", semester: "Fall 2026" },
    ]);
  });

  it("accepts bigint identifiers returned as strings", () => {
    expect(
      parseCourses([
        {
          id: "2",
          name: "Machine Learning",
          instructor: "John Doe",
          semester: "Fall 2026",
        },
      ])[0].id,
    ).toBe("2");
  });

  it.each(["name", "instructor", "semester"])("rejects blank %s fields", (field) => {
    expect(() =>
      parseCourses([
        {
          id: 1,
          name: "Design for AI",
          instructor: "Jane Doe",
          semester: "Fall 2026",
          [field]: "   ",
        },
      ]),
    ).toThrow("Supabase returned an invalid course row");
  });

  it("rejects non-array query data", () => {
    expect(() => parseCourses(null)).toThrow("Supabase returned invalid course data");
  });
});

describe("getCourses", () => {
  it("queries and returns validated courses in id order", async () => {
    const rows = [
      { id: 1, name: "Design for AI", instructor: "Jane Doe", semester: "Fall 2026" },
    ];
    const { client, calls } = fakeClient({ data: rows, error: null });

    await expect(getCourses(client)).resolves.toEqual(rows);
    expect(calls).toEqual([
      ["from", "courses"],
      ["select", "id, name, instructor, semester"],
      ["order", "id", { ascending: true }],
    ]);
  });

  it("returns an empty array when the query has no rows", async () => {
    const { client } = fakeClient({ data: null, error: null });

    await expect(getCourses(client)).resolves.toEqual([]);
  });

  it("uses a safe public message for query errors", async () => {
    const { client } = fakeClient({
      data: null,
      error: { message: "private database detail" },
    });

    await expect(getCourses(client)).rejects.toThrow("Unable to load courses right now.");
    await expect(getCourses(client)).rejects.not.toThrow("private database detail");
  });
});
