import Router from "koa-router";
import { requireAuth } from "../auth";
import ScreeningService from "../service/screeningService";
import { apiService } from "../api/backendApiService";
import { Screener } from "../models/Screener";
import { createStudentScreeningResult } from "../utils/studentScreenResult";
import { studentQueue } from "../server";
import { JobInfo } from "../models/Queue";
import { saveJobInQueueLog } from "../database/models/QueueLog";
import { IStudentScreeningResult } from "../models/StudentScreeningResult";
import LoggerService from "../utils/Logger";
import { isValidStatusChange } from "../utils/jobUtils";
const Logger = LoggerService("studentController.ts");

const studentRouter = new Router();

const screeningService = new ScreeningService();

studentRouter.post("/student/login", async (ctx) => {
  const { email } = ctx.request.body;

  let jobInfo: JobInfo;
  try {
    jobInfo = await screeningService.login(email);
  } catch (e) {
    ctx.body = "Could not login the student: " + e;
    ctx.status = 400;
    return;
  }
  if (!jobInfo) {
    ctx.body = "Could not login the student.";
    ctx.status = 400;
    return;
  }
  ctx.body = jobInfo;
});

studentRouter.post("/student/logout", async (ctx) => {
  const { email } = ctx.request.body;
  try {
    await screeningService.logout(email);
    ctx.body = "Student successfully logged out.";
  } catch (err) {
    ctx.body = "Could not logout student.";
    ctx.status = 400;
  }
});

studentRouter.post("/student/remove", requireAuth, async (ctx) => {
  const { email } = ctx.request.body;
  try {
    await studentQueue.remove(email);
    ctx.body = "Student Job successfully removed out.";
  } catch (err) {
    Logger.error(err);
    ctx.body = "Could not remove student.";
    ctx.status = 400;
  }
});

studentRouter.get("/student", requireAuth, async (ctx) => {
  const { email } = ctx.request.query;

  ctx.body = await apiService.getStudent(email);
});

studentRouter.get("/students", requireAuth, async (ctx) => {
  ctx.body = await apiService.getAllStudents();
});

studentRouter.get("/student/jobInfo", async (ctx) => {
  const { email } = ctx.request.query;
  ctx.body = await studentQueue.getJobWithPosition(email);
});

studentRouter.post("/student/verify", async (ctx) => {
  const screeningResult: IStudentScreeningResult | null =
    ctx.request.body.screeningResult;
  const studentEmail: string | null = ctx.request.body.studentEmail;

  if (!screeningResult || !studentEmail) {
    ctx.body = "Not the correct data.";
    ctx.status = 400;
    return;
  }

  try {
    await apiService.updateStudent(screeningResult, studentEmail);
    ctx.body = "Screening Result saved.";
    ctx.status = 200;
    return;
  } catch (err) {
    ctx.body = "Could not verify student.";
    ctx.status = 400;
    return;
  }
});

studentRouter.post("/student/changeJob", requireAuth, async (ctx: any) => {
  const job: JobInfo = ctx.request.body;

  if (!job) {
    ctx.body = "Could not change status of student.";
    ctx.status = 400;
    return;
  }
  const from = ctx.session.passport.user;
  const screener: Screener = await apiService.getScreener(from);

  if (!screener) {
    ctx.body = "Could not change status of student.";
    ctx.status = 400;
    return;
  }

  const screenerInfo = {
    id: screener.id,
    firstname: screener.firstname,
    lastname: screener.lastname,
    email: screener.email,
    time: Date.now(),
  };

  const oldJob = await studentQueue.getJobWithPosition(job.email);
  if (!oldJob) {
    ctx.body = "Could not change status of student because no oldJob found.";
    ctx.status = 400;
    return;
  }

  if (!isValidStatusChange(oldJob.status, job.status)) {
    Logger.warn(
      `Invalid Status change of Job ${job.email} from ${oldJob.status} to ${job.status}! Old Screener: ${oldJob.screener?.email} New Screener: ${screenerInfo?.email}`
    );
    ctx.body = "Invalid Status change of Job!";
    ctx.status = 400;
    return;
  }

  if (
    job.status === "active" &&
    job.screener &&
    job.screener.email !== screener.email
  ) {
    ctx.status = 400;
    ctx.body = "Ein Screener verifiziert diesen Studenten schon.";
    return;
  }

  if (job.status === "completed" || job.status === "rejected") {
    try {
      saveJobInQueueLog(job);
      await apiService.updateStudent(
        createStudentScreeningResult(job),
        job.email
      );
    } catch (err) {
      Logger.error(err);
      Logger.info("Student data could not be updated!");
    }
  }

  try {
    ctx.body = await studentQueue.changeJob(job.email, job, screenerInfo);
  } catch (err) {
    ctx.status = 400;
    ctx.body = "Something went wrong! ";
    Logger.error(err);
  }
});

export { studentRouter };
