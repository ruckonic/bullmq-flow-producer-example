import TestQueue from './test.queue'
import './child.worker'

const testQueue = new TestQueue()
testQueue.addWithFlow('simple-queue-child', {})
