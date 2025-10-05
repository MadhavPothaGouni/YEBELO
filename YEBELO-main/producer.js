const fs = require('fs');
const csv = require('csv-parser');
const { Kafka } = require('kafkajs');

// Kafka client
const kafka = new Kafka({
  clientId: 'trade-producer',
  brokers: ['localhost:29092'] // Correct broker for your setup
});

const producer = kafka.producer();
const csvFilePath = './trades_data.csv';

async function runProducer() {
  await producer.connect();
  console.log('✅ Producer connected');

  const messages = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      messages.push({ value: JSON.stringify(row) });
    })
    .on('end', async () => {
      try {
        if (messages.length > 0) {
          await producer.send({
            topic: 'trade-data',
            messages: messages
          });
          console.log(`🚀 Sent ${messages.length} messages to trade-data topic`);
        }
      } catch (err) {
        console.error('❌ Error sending messages:', err);
      } finally {
        await producer.disconnect();
        console.log('🛑 Producer disconnected');
      }
    });
}

runProducer().catch(console.error);
