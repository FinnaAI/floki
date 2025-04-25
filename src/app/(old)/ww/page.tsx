"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkerMessageT } from "@/types/workers/worker-message";
import type { CryptoWorkConfigT } from "@/workers/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type CryptoDataT = {
  bitcoin: string;
  ethereum: string;
  monero: string;
  litecoin: string;
};

export default function WwPage() {
  const workerRef = useRef<Worker>(null);
  const initPrice = "waiting for data...";
  const [status, setStatus] = useState<string>("Stopped");
  const [prices, setPrices] = useState<CryptoDataT>({
    bitcoin: "",
    ethereum: "",
    monero: "",
    litecoin: "",
  });

  useEffect(() => {
    workerRef.current = new Worker("/workers/workers/main.js", {
      type: "module",
    });

    workerRef.current.onmessage = (event) => {
      const data = event.data;

      // Check if this is a status message
      if (data.isStatus) {
        // Handle status updates
        switch (data.type) {
          case "connected":
            console.log("Worker connected to WebSocket");
            break;
          case "disconnected":
            console.log("Worker disconnected from WebSocket");
            break;
          case "error":
            console.error("Worker reported an error");
            break;
        }
        return;
      }

      // Handle price data updates
      setPrices((prev) => {
        const newState = { ...prev, ...data };
        // console.log("Received price update:", data);
        return newState;
      });
    };

    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const startWorker = () => {
    setStatus("Running");

    const workerMessage: WorkerMessageT<CryptoWorkConfigT> = {
      type: "init",
      payload: {
        data: {
          assets: "bitcoin,ethereum,monero,litecoin",
        },
      },
    };
    if (workerRef.current) {
      workerRef.current.postMessage(workerMessage);
    }
  };

  const stopWorker = () => {
    setStatus("Stopped");
    const workerMessage: WorkerMessageT<CryptoWorkConfigT> = {
      type: "stop",
    };
    if (workerRef.current) {
      workerRef.current.postMessage(workerMessage);
    }
  };

  const terminateWorker = () => {
    setStatus("Terminated");
    const workerMessage: WorkerMessageT<CryptoWorkConfigT> = {
      type: "stop",
    };
    if (workerRef.current) {
      workerRef.current.postMessage(workerMessage);
      workerRef.current.terminate();
    }
  };

  return (
    <section className="flex flex-col gap-4 justify-center items-center p-12">
      <Card>
        <CardHeader>
          <div className="mb-40 flex flex-row gap-4">
            <Button onClick={startWorker}>Start stream</Button>
            <Button onClick={stopWorker}>Stop stream</Button>
            <Button onClick={terminateWorker}>Terminate Worker</Button>
          </div>
        </CardHeader>
        <CardContent>
          <h2 className="heading-md mb-12">Stream data: {status}</h2>
          <p className="mb-40 body-sm">
            This page uses a Web Worker to stream cryptocurrency prices from
            Binance API. The worker is started when you click the "Start stream"
            button and stopped when you click the "Stop stream" button.
          </p>
          <div className="gap-12 flex-column">
            {Object.keys(prices).map((key) => {
              const price = prices[key as keyof CryptoDataT];
              return (
                <div key={key}>
                  <span className="mr-12 capitalize">{key}:</span>
                  <span className={`${!price && "opacity-20"}`}>
                    {price ? `$${price}` : initPrice}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
