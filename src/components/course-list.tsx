"use client";
import type { Course } from "@/src/lib/courses";
import type { User } from "@supabase/supabase-js";
import { useLanguage } from "./language-provider";

export function CourseList({ courses }: { courses: Course[] }) {
  const {t}=useLanguage();
  if (courses.length === 0) {
    return <p className="state-panel">{t("noCourses")}</p>;
  }

  return (
    <ul className="course-grid">
      {courses.map((course) => (
        <li className="course-card" key={course.id}>
          <p className="semester">{course.semester}</p>
          <h2>{course.name}</h2>
          <p>{course.instructor}</p>
        </li>
      ))}
    </ul>
  );
}

export function CourseCatalog({
  courses,
  hasError = false,
  user,
  authRequired = false,
}: {
  courses: Course[];
  hasError?: boolean;
  user: User | null;
  authRequired?: boolean;
}) {
  const {t}=useLanguage();
  return (
    <main className="catalog-shell">

      {authRequired && !user ? (
        <p className="state-panel auth-required" role="alert">
          {t("authRequired")}
        </p>
      ) : null}
      <header className="catalog-header">
        <p className="eyebrow">{t("catalogEyebrow")}</p>
        <h1>{t("catalogTitle")}</h1>
        <p className="intro">
          {t("catalogIntro")}
        </p>
        <p className="data-status">
          <span aria-hidden="true" />
          {t("liveData")}
        </p>
      </header>

      {hasError ? (
        <p className="state-panel error-panel" role="alert">
          {t("coursesError")}
        </p>
      ) : (
        <CourseList courses={courses} />
      )}
    </main>
  );
}
