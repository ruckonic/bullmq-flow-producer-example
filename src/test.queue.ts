import { Queue, Worker, FlowProducer } from 'bullmq'
import IORedis from 'ioredis'
const connection = new IORedis({
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

class TestQueue {
  name = 'test-queue'
  #queue: Queue
  #worker: Worker
  #flowProducer: FlowProducer

  constructor() {
    this.#queue = new Queue(this.name, {
      connection,
      sharedConnection: true,
      defaultJobOptions: {
        removeOnFail: true,
        removeOnComplete: true,
      },
    })

    this.#worker = new Worker(
      this.name,
      async (job) => Promise.resolve('done ' + job.id),
      {
        connection,
        sharedConnection: true,
      }
    )

    this.#flowProducer = new FlowProducer({
      connection,
      sharedConnection: true,
    })

    this.registerEvents()
  }

  registerEvents() {
    this.#worker.on('completed', (job, result) => {
      console.log('completed', job.name, result)
    })

    this.#worker.on('failed', (job, err) => {
      console.log('failed', job.name, err.message)
    })
  }

  addSimple(name: string, data: any) {
    return this.#queue.add(name, data)
  }

  addWithFlow(name: string, data: any) {
    return this.#flowProducer.add({
      name,
      data,
      queueName: this.name,
      children: [
        {
          name: 'child1',
          data: { timeout: 40000 },
          queueName: 'child-queue',
        },
        {
          name: 'child2',
          data: { timeout: 1000 },
          queueName: 'child-queue',
          opts: {
            removeOnComplete: true,
            removeOnFail: true,
          },
        },
        {
          name: 'child3',
          data: { timeout: 30000 },
          queueName: 'child-queue',
        },
      ],
      opts: { removeOnComplete: true, removeOnFail: true },
    })
  }
}

export default TestQueue
