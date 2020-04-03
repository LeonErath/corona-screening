import { Student } from "../database/models/Student";
import { Job } from "../queue";

export const createJob = (student: Student): Job => {
  const getSubject = (subject: string): string =>
    subject.replace(/[0-9]+|:/g, "");

  const getValues = (subject: string | null): number[] => {
    try {
      const matchGroup = subject.match(/[0-9]+:[0-9]+/g);
      if (matchGroup) {
        return matchGroup[0].split(":").map((s) => parseInt(s));
      }
      return [1, 13];
    } catch (err) {
      console.error(err);
      return [1, 13];
    }
  };

  let subjects = [];
  try {
    subjects = JSON.parse(student.subjects);
  } catch (err) {
    console.log("could not parse subjects");
  }

  return {
    firstname: student.firstname,
    lastname: student.lastname,
    email: student.email,
    subjects: subjects.map((s: string) => ({
      subject: getSubject(s),
      min: getValues(s)[0],
      max: getValues(s)[1],
    })),
    phone: student.phone,
    knowcsfrom: student.knowsUsFrom,
    birthday: student.birthday,
    msg: student.msg,
    invited: student.invited,
    feedback: student.feedback,
    commentScreener: student.commentScreener,
    time: Date.now(),
    jitsi: `https://meet.jit.si/${student.firstname}_${
      student.lastname
    }_${Date.now()}`,
    status: "waiting",
  };
};
