import { IRawStudent } from "./Student";

// TODO: Do we serialize the Many to Many relations and send them to this backend?
export interface Course {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  // instructors?: Student[];
  name: string;
  outline: string;
  description: string;
  imageUrl: string | null;
  category: CourseCategory;
  // tags?: CourseTag[];
  // subcourses?: Subcourse[];
  courseState: CourseState;
  screeningComment: string | null;
}

export interface ApiCourseUpdate {
  courseState?:
    | CourseState.ALLOWED
    | CourseState.DENIED
    | CourseState.CANCELLED;
  name?: string;
  description?: string;
  outline?: string;
  category?: CourseCategory;
  imageUrl?: string | null;
  screeningComment?: string | null;
  instructors?: { id: number }[];
  newLectures?: ApiAddLecture[];
  removeLectures?: { id: number }[];
}

export enum CourseState {
  CREATED = "created",
  SUBMITTED = "submitted",
  ALLOWED = "allowed",
  DENIED = "denied",
  CANCELLED = "cancelled",
}

export enum CourseCategory {
  REVISION = "revision",
  CLUB = "club",
  COACHING = "coaching",
}

export interface ApiAddLecture {
  subcourse: { id: number };
  start: Date;
  duration: number;
  instructor: { id: number };
}
