import crypto from "crypto";
import { StudentData, Status } from "../models/Queue";
import { Student } from "../models/Student";
import LoggerService from "../utils/Logger";

const Logger = LoggerService("jobUtils.ts");

export const getId = (email: string) =>
  crypto.createHash("md5").update(email).digest("hex");

export const createJob = (id: string, student: Student): StudentData => {
  const getSubject = (subject: string): string | null => {
    try {
      return subject.replace(/[0-9]+|:/g, "");
    } catch (err) {
      return null;
    }
  };

  const getValues = (subject: string | null): number[] => {
    try {
      const matchGroup = subject.match(/[0-9]+:[0-9]+/g);
      if (matchGroup) {
        return matchGroup[0].split(":").map((s) => parseInt(s));
      }
      return [1, 13];
    } catch (err) {
      Logger.error(err);
      return [1, 13];
    }
  };

  let subjects = [];
  try {
    subjects = JSON.parse(student.subjects).map((s: any) => {
      if (getSubject(s)) {
        return {
          subject: getSubject(s),
          min: getValues(s)[0],
          max: getValues(s)[1],
        };
      } else {
        return {
          subject: s.name,
          min: s.minGrade,
          max: s.maxGrade,
        };
      }
    });
  } catch (err) {
    Logger.info("Cannot parse");
  }

  return {
    id,
    firstname: student.firstname,
    lastname: student.lastname,
    email: student.email,
    subjects: subjects,
    phone: student.phone,
    knowcsfrom: "",
    msg: student.msg,
    feedback: student.feedback,
    commentScreener: "",
    jitsi: `https://meet.jit.si/${id}`,
  };
};

export const isValidStatusChange = (
  oldStatus: Status,
  newStatus: Status
): boolean => {
  if (oldStatus === "active" && newStatus === "waiting") {
    return false;
  }
  if (oldStatus === "completed" && newStatus === "active") {
    return false;
  }
  if (oldStatus === "rejected" && newStatus === "active") {
    return false;
  }
  if (oldStatus === "completed" && newStatus === "waiting") {
    return false;
  }
  if (oldStatus === "rejected" && newStatus === "waiting") {
    return false;
  }
  if (oldStatus === "waiting" && newStatus === "completed") {
    return false;
  }

  return true;
};

export const isValidScreenerChange = (
  oldJob: Partial<StudentData>,
  newJob: StudentData
) => {
  // if (!oldJob.screener) {
  // 	return true;
  // }
  // if (!newJob.screener) {
  // 	return false;
  // }
  // if (oldJob.screener.email === newJob.screener.email) {
  // 	return true;
  // }
  // if (oldJob.status !== "waiting" || newJob.status !== "waiting") {
  // 	return false;
  // }

  return true;
};
