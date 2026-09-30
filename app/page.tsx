import { connection } from "next/server";
import { CourseCatalog } from "@/src/components/course-list";
import { getCourses } from "@/src/lib/courses";
import type { Course } from "@/src/lib/courses";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  await connection();

  let courses: Course[] = [];
  let hasError = false;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    courses = await getCourses();
  } catch {
    hasError = true;
  }

  const { auth } = await searchParams;

  return (
    <CourseCatalog
      courses={courses}
      hasError={hasError}
      user={user}
      authRequired={auth === "required"}
    />
  );
}
