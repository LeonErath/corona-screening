import Router from "koa-router";
import redis from "redis";
import crypto from "crypto";
import LoggerService from "../utils/Logger";
const Logger = LoggerService("openHoursController.ts");

const openHoursController = new Router();

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const KEY = "OPENING_HOURS";

const client = redis.createClient({ url: REDIS_URL });

const get = (key: string) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, reply) => {
      if (err) {
        reject(err);
      }
      resolve(JSON.parse(reply));
    });
  });
};

const set = (key: string, data: string) => {
  return new Promise((resolve, reject) => {
    client.set(key, data, (err, success) => {
      if (err) {
        reject(err);
      }
      if (!success) {
        reject("No opening hours found.");
      }
      resolve(success);
    });
  });
};

// week: 1 = Monday, 2 = Tuesday ...
interface ITime {
  week: number;
  from: string;
  to: string;
}

interface IDatabaseTime extends ITime {
  id: string;
}

openHoursController.get("/openingHours", async (ctx) => {
  try {
    ctx.body = await get(KEY);
  } catch (err) {
    ctx.body = err;
  }
});

openHoursController.post("/openingHours", async (ctx) => {
  try {
    const data: ITime[] = ctx.request.body;
    const save: IDatabaseTime[] = data.map((t) => {
      const id = `${t.week}-${t.from}-${t.to}`;
      return { ...t, id: crypto.createHash("md5").update(id).digest("hex") };
    });
    await set(KEY, JSON.stringify(save));
    ctx.body = await get(KEY);
  } catch (err) {
    ctx.body = err;
  }
});

export { openHoursController };
