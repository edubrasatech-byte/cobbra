import { getDb } from '@/lib/db';

let reminderQueue = null;
let isBullMQActive = false;

// Dynamic initialization of BullMQ with fallback to inline/memory execution if Redis is not available
if (process.env.REDIS_URL) {
  try {
    const { Queue, Worker } = require('bullmq');
    const IORedis = require('ioredis');

    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    reminderQueue = new Queue('reminderOutreachQueue', { connection });
    isBullMQActive = true;
    console.log('⚡ [BULLMQ] reminderOutreachQueue successfully initialized on Redis!');

    // Initialize the background worker
    const worker = new Worker('reminderOutreachQueue', async (job) => {
      const { chargeId, type } = job.data;
      console.log(`🤖 [BULLMQ WORKER] Processing job ${job.id} of type ${type} for charge ${chargeId}`);
      await processReminderJob(chargeId, type);
    }, { connection });

    worker.on('completed', (job) => {
      console.log(`✅ [BULLMQ WORKER] Job ${job.id} completed!`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ [BULLMQ WORKER] Job ${job.id} failed:`, err);
    });

  } catch (error) {
    console.warn('⚠️ [BULLMQ] Failed to initialize BullMQ. Falling back to local memory queue.', error.message);
  }
} else {
  console.log('ℹ️ [QUEUES] REDIS_URL not set. Using high-performance memory fallback for outreach queue.');
}

// Actual core business logic of the outreach worker
async function processReminderJob(chargeId, type) {
  try {
    // 1. Trigger outreach via internal API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/lembretes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        charge_id: chargeId,
        channel: 'both', // Disparar e-mail e WhatsApp se configurado
        type: type // 'reminder' | 'overdue' | 'daily'
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to process outreach: ${errText}`);
    }
  } catch (err) {
    console.error(`[OUTREACH WORKER ERROR] Failed on charge ${chargeId}:`, err);
    throw err; // Let BullMQ retry
  }
}

// Public API to enqueue jobs
export async function enqueueReminderJob(chargeId, type = 'reminder') {
  if (isBullMQActive && reminderQueue) {
    try {
      const job = await reminderQueue.add(`outreach_${chargeId}`, { chargeId, type }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000 // Retry after 5s, 10s, 20s
        }
      });
      console.log(`📥 [BULLMQ] Enqueued outreach job ${job.id} for charge ${chargeId}`);
      return { success: true, jobId: job.id, type: 'bullmq' };
    } catch (e) {
      console.error('❌ [BULLMQ ENQUEUE ERROR] Falling back to inline execution:', e);
    }
  }

  // Elegant fallback: Run asynchronously in a background promise (memory queue)
  console.log(`🏃 [MEMORY QUEUE] Processing outreach for charge ${chargeId} in background...`);
  processReminderJob(chargeId, type).catch(err => {
    console.error('❌ [MEMORY QUEUE ERROR] Background outreach failed:', err.message);
  });

  return { success: true, type: 'memory_fallback' };
}
