import type { WorkerMessageT } from "@/types/workers/worker-message";

let pricesWs: WebSocket | null = null;

export type CryptoWorkConfigT = {
	assets: string; // bitcoin,ethereum,monero,litecoin
};

// Use self instead of WorkerGlobalScope for better TypeScript compatibility
self.onmessage = (event: MessageEvent<WorkerMessageT<unknown>>) => {
	const { type } = event.data;

	switch (type) {
		case "init": {
			try {
				// Get the asset names from the message
				const data = event.data.payload?.data as CryptoWorkConfigT;

				// Close existing connection if any
				if (pricesWs) {
					pricesWs.close();
					pricesWs = null;
				}

				// For Binance we need to map our common crypto names to their symbols
				const assetMap: Record<string, string> = {
					bitcoin: "btcusdt",
					ethereum: "ethusdt",
					monero: "xmrusdt",
					litecoin: "ltcusdt",
				};

				// Get the assets from our data and map them to Binance symbols
				const binanceStreams = data?.assets
					.split(",")
					.map((asset) => `${assetMap[asset.toLowerCase()]}@ticker`)
					.filter(Boolean)
					.join("/");

				console.log("Connecting to Binance streams:", binanceStreams);

				// Connect to Binance WebSocket API with the correct stream format
				pricesWs = new WebSocket(
					`wss://stream.binance.com:9443/stream?streams=${binanceStreams}`,
				);

				// Message handler for receiving price updates
				pricesWs.onmessage = (msg) => {
					try {
						const response = JSON.parse(msg.data);

						if (response?.data) {
							const ticker = response.data;
							// Extract the base symbol (remove USDT and make lowercase)
							const symbol = ticker.s.replace("USDT", "").toLowerCase();

							// Map Binance symbols back to our common crypto names
							const reverseMap: Record<string, string> = {
								btc: "bitcoin",
								eth: "ethereum",
								xmr: "monero",
								ltc: "litecoin",
							};

							const cryptoName = reverseMap[symbol];
							if (cryptoName) {
								// Format data to match the expected format in the UI
								const data: Record<string, string> = {
									[cryptoName]: ticker.c, // Current price
								};
								self.postMessage(data);
							}
						}
					} catch (error) {
						console.error("Failed to parse message:", error);
					}
				};

				// Connection established handler
				pricesWs.onopen = () => {
					console.log("WebSocket connection established with Binance");
					// Don't mix status messages with data
					self.postMessage({ type: "connected", isStatus: true });
				};

				// Error handler
				pricesWs.onerror = (error) => {
					console.error("WebSocket error:", error);
					self.postMessage({ type: "error", isStatus: true });
				};

				// Connection closed handler
				pricesWs.onclose = () => {
					console.log("WebSocket connection closed");
					pricesWs = null;
					self.postMessage({ type: "disconnected", isStatus: true });
				};
			} catch (error) {
				console.error("Failed to create WebSocket:", error);
			}
			break;
		}

		case "stop": {
			// Safely close the WebSocket if it's open
			if (pricesWs) {
				console.log("Closing WebSocket connection...");
				pricesWs.close();
				pricesWs = null;
			}
			break;
		}

		default: {
			console.error("Unhandled message type:", type);
		}
	}
};
