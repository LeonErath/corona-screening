import ScreeningService from "../service/screeningService";
import { io, studentQueue } from "../server";
import { RedisClient } from "redis";
import { Message, JobInfo, QueueChanges, ScreenerInfo } from "../models/Queue";
import {
  ScreenerEmitter,
  screenerEmitterEvents,
} from "../socket/screenerSocket";
import { StudentSocketActions } from "../socket/studentSocket";

const updateStudent = (
  message: Message,
  jobInfo: JobInfo,
  io: SocketIO.Server
): void => {
  io.sockets.in(message.email).emit(StudentSocketActions.UPDATE_JOB, jobInfo);
};

const changeStatus = async (message: Message): Promise<void> => {
  const jobList = await studentQueue.listInfo();

  for (const jobInfo of jobList) {
    if (jobInfo.email === message.email) {
      console.log(jobInfo.status, jobInfo.email);

      updateStudent(message, jobInfo, io);
    } else if (jobInfo.status === "waiting") {
      io.sockets
        .in(jobInfo.email)
        .emit(StudentSocketActions.UPDATE_JOB, jobInfo);
    }
  }
};

const removeJob = async (message: Message): Promise<void> => {
  console.log("removedJob");

  const jobList = await studentQueue.listInfo();

  io.sockets
    .in(message.email)
    .emit(StudentSocketActions.REMOVED_JOB, message.email);
  for (const jobInfo of jobList) {
    if (jobInfo.status === "waiting") {
      console.log("updated", jobInfo.email);

      io.sockets
        .in(jobInfo.email)
        .emit(StudentSocketActions.UPDATE_JOB, jobInfo);
    }
  }
};

let subcriber: null | RedisClient = null;

interface StudentSubscriber {
  init: (screeningService: ScreeningService) => StudentSubscriber;
  listen: () => void;
}

export const studentSubscriber: StudentSubscriber = {
  init: (): StudentSubscriber => {
    subcriber = studentQueue.getClient().duplicate();
    subcriber.subscribe("queue");
    return studentSubscriber;
  },

  listen: (): void => {
    if (!subcriber) {
      console.error("Could not start StudentSubscriber");
      return;
    }

    ScreenerEmitter.on(
      screenerEmitterEvents.UPDATE_SCREENER,
      async (screenerCount: number) => {
        const jobList = await studentQueue.listInfo();

        jobList
          .filter((j) => j.status === "waiting")
          .map((j) =>
            io.sockets.in(j.email).emit(StudentSocketActions.UPDATE_SCREENER, {
              screenerCount,
            })
          );
      }
    );

    subcriber.on("message", async (_, data) => {
      const message: Message = JSON.parse(data);

      switch (message.operation) {
        case QueueChanges.ADDED_JOB: {
          console.log("Student Subscriber: added Job");
          break;
        }
        case QueueChanges.CHANGED_STATUS: {
          console.log("Student Subscriber: changed Status");
          changeStatus(message);
          break;
        }
        case QueueChanges.REMOVED_JOB: {
          console.log("Student Subscriber: removed Job");
          removeJob(message);
          break;
        }
      }
    });
  },
};
