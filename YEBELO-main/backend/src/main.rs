use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::message::Message;
use rdkafka::producer::{FutureProducer, FutureRecord};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;

#[derive(Deserialize, Serialize, Debug, Clone)]
struct Trade {
    token_address: String,
    price_in_sol: f64,
    block_time: String,
}

#[derive(Debug)] 
struct TokenData {
    prices: Vec<f64>,
}

impl TokenData {
    fn new() -> Self {
        Self { prices: Vec::new() }
    }

    fn update(&mut self, price: f64) {
        self.prices.push(price);
        if self.prices.len() > 14 {
            self.prices.remove(0); // keep last 14
        }
    }

    fn calculate_rsi(&self) -> Option<f64> {
        if self.prices.len() < 14 {
            return None;
        }
        let mut gains = 0.0;
        let mut losses = 0.0;

        for i in 1..self.prices.len() {
            let change = self.prices[i] - self.prices[i - 1];
            if change > 0.0 {
                gains += change;
            } else {
                losses += change.abs();
            }
        }

        if losses == 0.0 {
            Some(100.0)
        } else {
            let rs = gains / losses;
            Some(100.0 - (100.0 / (1.0 + rs)))
        }
    }
}

#[tokio::main]
async fn main() {
    // Kafka consumer
    let consumer: StreamConsumer = ClientConfig::new()
        .set("group.id", "trade_rsi_group_test3")
        .set("auto.offset.reset", "earliest")
        .set("bootstrap.servers", "localhost:29092")
        .create()
        .expect("Consumer creation failed");

    consumer
        .subscribe(&["trade-data"])
        .expect("Can't subscribe to topic");

    // Kafka producer
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", "localhost:29092")
        .create()
        .expect("Producer creation failed");

    let mut tokens: HashMap<String, TokenData> = HashMap::new();

    println!("✅ Rust backend connected. Waiting for trade messages...");

    loop {
        match consumer.recv().await {
            Err(e) => eprintln!("❌ Kafka error: {}", e),
            Ok(m) => {
                if let Some(payload) = m.payload() {
                    // Clean message
                    let clean_payload = String::from_utf8_lossy(payload)
                        .replace("\r", "")
                        .replace("\n", "")
                        .trim()
                        .to_string();

                    println!("📩 Received raw message: {}", clean_payload);

                    // Try parsing JSON safely
                    let trade_result: Result<Trade, _> = serde_json::from_str(&clean_payload);
                    if let Ok(trade) = trade_result {
                        let token_entry = tokens
                            .entry(trade.token_address.clone())
                            .or_insert(TokenData::new());
                        token_entry.update(trade.price_in_sol);

                        if let Some(rsi) = token_entry.calculate_rsi() {
                            let rsi_json = serde_json::json!({
                                "token_address": trade.token_address,
                                "rsi": rsi,
                                "block_time": trade.block_time
                            });

                            let payload_string = rsi_json.to_string();
                            let key_string = trade.token_address.clone();

                            let record = FutureRecord::to("rsi-data")
                                .payload(&payload_string)
                                .key(&key_string);

                            let _ = producer.send(record, Duration::from_secs(0)).await;
                            println!("📊 RSI calculated: {:?}", rsi_json);
                        } else {
                            println!(
                                "⚠️ Not enough data yet to calculate RSI for {} ({} / 14)",
                                trade.token_address,
                                tokens.get(&trade.token_address).unwrap().prices.len()
                            );
                        }
                    } else {
                        eprintln!("⚠️ Skipping invalid JSON message: {}", clean_payload);
                    }
                }
            }
        }
    }
}
