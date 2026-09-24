import { connection } from "next/server";
import { CourseCatalog } from "@/src/components/course-list";
import { getCourses } from "@/src/lib/courses";
import type { Course } from "@/src/lib/courses";

export default async function Home() {
  await connection();

  let courses: Course[] = [];
  let hasError = false;

  try {
    courses = await getCourses();
  } catch {
    hasError = true;
  }

  return <CourseCatalog courses={courses} hasError={hasError} />;
}
