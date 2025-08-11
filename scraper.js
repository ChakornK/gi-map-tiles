import fs from "node:fs";
import path from "node:path";

const dest = path.join(process.cwd(), "tiles");
console.log("Writing to", dest);

const threadCount = 32;
const baseUrl = "https://game-cdn.appsample.com/gim/map-teyvat/v58-rc2";
const ranges = {
	10: {
		x: [-2, 1],
		y: [-2, 1],
	},
	11: {
		x: [-4, 3],
		y: [-4, 2],
	},
	12: {
		x: [-8, 7],
		y: [-8, 5],
	},
	13: {
		x: [-16, 15],
		y: [-16, 10],
	},
	14: {
		x: [-32, 31],
		y: [-32, 20],
	},
	15: {
		x: [-64, 63],
		y: [-64, 41],
	},
};

class DownloadThread {
	constructor(i) {
		this.urls = [];
		this.threadNum = i;
	}
	add(url) {
		this.urls.push(url);
	}
	async start() {
		for (const url of this.urls) {
			console.log(`[${this.threadNum}] Downloading`, url.dest);
			const res = await fetch(`${baseUrl}/${url.src}`);
			const buffer = Buffer.from(await res.arrayBuffer());
			fs.writeFileSync(`${dest}/${url.dest}`, buffer);
		}
	}
}

let t = 0;
const threads = [];
for (let i = 0; i < threadCount; i++) {
	threads.push(new DownloadThread(i));
}
for (const [scale, range] of Object.entries(ranges)) {
	if (!fs.existsSync(`${dest}/${scale}`)) {
		fs.mkdirSync(`${dest}/${scale}`, { recursive: true });
	}
	for (let x = range.x[0]; x <= range.x[1]; x++) {
		for (let y = range.y[0]; y <= range.y[1]; y++) {
			threads[t++ % threadCount].add({
				src: `${scale}/tile-${x}_${y}.jpg`,
				dest: `${scale}/${x}_${y}.jpg`,
			});
		}
	}
}
const startTime = Date.now();
const promises = threads.map((t) => {
	return new Promise((r) => {
		(async () => {
			await t.start();
			r();
		})();
	});
});
await Promise.all(promises);
const endTime = Date.now();

console.log(`Finished in ${Math.ceil((endTime - startTime) / 10) / 100}s`);
