import Router from "koa-router";
import {
  OpenHoursController,
  QueueController,
  StudentController,
  ScreenerController,
  StatisticsController,
  CourseController,
} from "./controller";
import { requireAuth } from "./auth";
import { DefaultState, Context } from "koa";
import InstructorController from "./controller/InstructorController";

const router = new Router<DefaultState, Context>();
router.get("/", async (ctx) => {
  ctx.body = "Hello World";
  ctx.status = 200;
});

router.get("/ping", async (ctx) => {
  ctx.body = "pong";
  ctx.status = 200;
});

// Opening Hours
router.get("/openingHours", OpenHoursController.getOpeningHours);
router.post(
  "/openingHours",
  requireAuth,
  OpenHoursController.changeOpeningHours
);

// QueueController
router.post("/queue/reset", requireAuth, QueueController.resetQueue);
router.get("/queue/jobs", requireAuth, QueueController.listJobs);

// StudentController
router.post("/student/login", StudentController.login);
router.post("/student/logout", StudentController.logout);
router.post("/student/remove", requireAuth, StudentController.remove);
router.get("/student", requireAuth, StudentController.get);
router.get("/student/all", requireAuth, StudentController.getAll);
router.get("/student/jobInfo", StudentController.getInfo);
router.post("/student/verify", StudentController.verify);
router.post("/student/changeJob", requireAuth, StudentController.changeJob);

// ScreenerController
router.post("/screener/create", requireAuth, ScreenerController.create);
router.get("/screener/status", ScreenerController.getStatus);
router.post("/screener/login", ScreenerController.login);
router.get("/screener/logout", ScreenerController.logout);
router.get("/screener/info", requireAuth, ScreenerController.getInfo);

// CourseController
router.get("/courses", requireAuth, CourseController.getCourses);
router.post("/course/:id/update", requireAuth, CourseController.updateCourse);

// StatisticsController
router.get("/statistics/logs", requireAuth, StatisticsController.getLogs);
router.get("/queue/statistics", StatisticsController.getStatistics);

// InstructorController
router.get("/instructors", requireAuth, InstructorController.getInstructors);
router.post("/instructor/:id/update", requireAuth, InstructorController.updateInstructor);

export default router;
