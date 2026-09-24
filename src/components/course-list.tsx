import type { Course } from "@/src/lib/courses";

export function CourseList({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return <p className="state-panel">No courses are available yet.</p>;
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
}: {
  courses: Course[];
  hasError?: boolean;
}) {
  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <p className="eyebrow">Design for AI · Assignment 2</p>
        <h1>Course Catalog</h1>
        <p className="intro">
          A small collection of courses rendered from a secure, read-only Supabase table.
        </p>
        <p className="data-status">
          <span aria-hidden="true" />
          Live data from Supabase
        </p>
      </header>

      {hasError ? (
        <p className="state-panel error-panel" role="alert">
          Unable to load courses right now.
        </p>
      ) : (
        <CourseList courses={courses} />
      )}
    </main>
  );
}
