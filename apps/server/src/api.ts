import { createApp } from "./app.js";

const app = createApp({ logger: true });
await app.listen({
	host: process.env.HOST ?? "127.0.0.1",
	port: Number(process.env.PORT ?? 3000),
});
