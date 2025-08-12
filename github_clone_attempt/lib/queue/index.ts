type Task = () => Promise<void>;

export class SimpleQueue {
  private concurrency: number;
  private running = 0;
  private q: Task[] = [];

  constructor(concurrency = 2) {
    this.concurrency = concurrency;
  }

  push(task: Task) {
    this.q.push(task);
    this.run();
  }

  private run() {
    while (this.running < this.concurrency && this.q.length > 0) {
      const t = this.q.shift()!;
      this.running++;
      t()
        .catch(() => {})
        .finally(() => {
          this.running--;
          this.run();
        });
    }
  }
}

export const conversionQueue = new SimpleQueue(process.platform === 'darwin' ? 2 : 4);

