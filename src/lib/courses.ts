import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

export type Course = {
  id: number | string;
  name: string;
  instructor: string;
  semester: string;
};

export function parseCourses(value: unknown): Course[] {
  if (!Array.isArray(value)) {
    throw new Error("Supabase returned invalid course data");
  }

  return value.map((row) => {
    if (!row || typeof row !== "object") {
      throw new Error("Supabase returned an invalid course row");
    }

    const candidate = row as Record<string, unknown>;
    const validId = typeof candidate.id === "number" || typeof candidate.id === "string";
    const validText = [candidate.name, candidate.instructor, candidate.semester].every(
      (item) => typeof item === "string" && item.trim().length > 0,
    );

    if (!validId || !validText) {
      throw new Error("Supabase returned an invalid course row");
    }

    return {
      id: candidate.id as number | string,
      name: (candidate.name as string).trim(),
      instructor: (candidate.instructor as string).trim(),
      semester: (candidate.semester as string).trim(),
    };
  });
}

type CourseQueryResult = Promise<{ data: unknown; error: unknown }>;

export type CourseQueryClient = {
  from(table: string): {
    select(columns: string): {
      order(column: string, options: { ascending: boolean }): CourseQueryResult;
    };
  };
};

function createCourseClient(): CourseQueryClient {
  const { url, anonKey } = getSupabaseConfig(process.env);

  return createClient(url, anonKey) as unknown as CourseQueryClient;
}

export async function getCourses(
  client: CourseQueryClient = createCourseClient(),
): Promise<Course[]> {
  const { data, error } = await client
    .from("courses")
    .select("id, name, instructor, semester")
    .order("id", { ascending: true });

  if (error) {
    throw new Error("Unable to load courses right now.");
  }

  return parseCourses(data ?? []);
}
