import { connect } from "nats";

export const nc = await connect({
  servers: "nats://localhost:4222",
});

export const jsm = await nc.jetstreamManager();
