const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "trade-consumer",
  brokers: ["localhost:29092"],
});

const consumer = kafka.consumer({ groupId: "trade-group-dynamic" });

const run = async () => {
  await consumer.connect();
  console.log("✅ Consumer connected");

  await consumer.subscribe({ topic: "trade-data", fromBeginning: true });

  let timeout;

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`📩 Token: ${data.token_address}, Price: ${data.price_in_sol}, Time: ${data.block_time}`);

      // Clear previous timeout and set a new one to exit after 2 seconds of inactivity
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        console.log("✅ No new messages. Exiting...");
        await consumer.disconnect();
        process.exit(0);
      }, 2000);
    },
  });
};

run().catch(console.error);
