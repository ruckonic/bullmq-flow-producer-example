import { Worker } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis({
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

const worker = new Worker(
  'child-queue',
  (job) => {
    const { timeout = 0 } = job.data || {}

    return new Promise((resolve) => {
      if (!timeout) {
        throw new Error('timeout is required')
      }

      setTimeout(() => {
        resolve('Child done ' + job.name)
      }, timeout)
    })
  },
  {
    concurrency: 3,
    connection,
    sharedConnection: true,
  }
)

worker.on('completed', (job, result) => {
  console.log('child completed', job.id, result)
})
