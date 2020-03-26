import redis, { RedisClient } from "redis";
import { reject, resolve } from "bluebird";

const KEY = "QUEUE";

export type Status = "waiting" | "active" | "completed" | "rejected";

export interface Job {
	firstname: string;
	lastname: string;
	email: string;
	time: number;
	jitsi: string;
	status: Status;
}

export default class Queue {
	private client: RedisClient;

	constructor(url: string) {
		this.client = redis.createClient({ url: url });
	}

	add = async (job: Job) => {
		return (
			(await this.getJobWithPosition(job.email)) ??
			new Promise((resolve, reject) => {
				this.client.rpush(KEY, JSON.stringify(job), err => {
					if (err) {
						return reject(err);
					} else {
						resolve(this.getJobWithPosition(job.email));
					}
				});
			})
		);
	};

	remove = async (email: string): Promise<boolean> => {
		const currentList = await this.list();
		console.log(currentList, email);

		const job = currentList.find(job => job.email === email);

		return new Promise((resolve, reject) => {
			if (!job) {
				reject("No job found.");
			}

			this.client.lrem(KEY, 0, JSON.stringify(job), (err, number) => {
				if (err) {
					return reject(err);
				}
				return resolve(true);
			});
		});
	};

	getJobWithPosition = async (email: string) => {
		const currentList = await this.list();
		const position: number = currentList.findIndex(job => job.email === email);
		if (position === -1) {
			return null;
		}
		return currentList[position]
			? { ...currentList[position], position }
			: null;
	};

	changeStatus = async (email: string, status: Status) => {
		const { position, ...job } = await this.getJobWithPosition(email);
		job.status = status;
		this.client.lset(KEY, position, JSON.stringify(job));
		return { ...job, position };
	};

	reset = () => {
		return new Promise((resolve, reject) => {
			this.client.del(KEY, (err, res) => {
				if (err) {
					reject("Could not delete list.");
				}
				resolve([]);
			});
		});
	};

	list = (): Promise<Job[]> => {
		return new Promise((resolve, reject) => {
			this.client.lrange(KEY, 0, -1, (err, res) => {
				if (err) {
					reject(err);
				} else {
					const list: Job[] = res.map(job => JSON.parse(job));
					resolve(list.sort((a, b) => a.time - b.time));
				}
			});
		});
	};

	listInfo = async () => {
		return new Promise((resolve, reject) => {
			this.list()
				.then(list => {
					resolve(list.map((job, position) => ({ ...job, position })));
				})
				.catch(err => {
					reject(err);
				});
		});
	};
}
