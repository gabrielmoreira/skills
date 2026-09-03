import { createLabelWriter } from "./labels.js";

export function createWorker(deps) {
  const labels = createLabelWriter(deps);
  return {
    async drain(queue) {
      let printed = 0;
      for (const job of await queue.take(20)) {
        await labels.print(job.consignment);
        printed++;
      }
      return printed;
    },
  };
}
