import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CourseCatalog, CourseList } from "./course-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

afterEach(cleanup);

describe("CourseList", () => {
  it("renders course details", () => {
    render(
      <CourseList
        courses={[
          {
            id: 1,
            name: "Design for AI",
            instructor: "Alex Morgan",
            semester: "Fall 2026",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Design for AI" })).toBeTruthy();
    expect(screen.getByText("Alex Morgan")).toBeTruthy();
    expect(screen.getByText("Fall 2026")).toBeTruthy();
  });

  it("renders an intentional empty state", () => {
    render(<CourseList courses={[]} />);

    expect(screen.getByText("No courses are available yet.")).toBeTruthy();
  });
});

describe("CourseCatalog", () => {
  it("shows that successful rows come from Supabase", () => {
    render(<CourseCatalog courses={[]} user={null} />);

    expect(screen.getByRole("heading", { name: "Course Catalog" })).toBeTruthy();
    expect(screen.getByText("Live data from Supabase")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeTruthy();
  });

  it("renders a visible safe error state", () => {
    render(<CourseCatalog courses={[]} hasError user={null} />);

    expect(screen.getByRole("alert").textContent).toBe("Unable to load courses right now.");
  });

  it("prompts a redirected visitor to sign in", () => {
    render(<CourseCatalog courses={[]} user={null} authRequired />);

    expect(screen.getByRole("alert").textContent).toBe(
      "Please sign in with Google to view that page.",
    );
  });
});
