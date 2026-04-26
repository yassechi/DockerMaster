import http, { IncomingMessage, ServerResponse } from "node:http";

const PORT = Number(process.env.PORT || 3002);

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
};

const cars: Car[] = [
  { id: 1, brand: "Peugeot", model: "208", year: 2022 },
  { id: 2, brand: "Renault", model: "Clio", year: 2021 },
  { id: 3, brand: "Tesla", model: "Model 3", year: 2024 }
];

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";

  if (method === "GET" && url === "/") {
    sendJson(res, 200, {
      message: "API voitures",
      endpoints: ["/cars", "/cars/1"]
    });
    return;
  }

  if (method === "GET" && url === "/cars") {
    sendJson(res, 200, { items: cars });
    return;
  }

  if (method === "GET" && url.startsWith("/cars/")) {
    const id = Number(url.split("/")[2]);
    const car = cars.find((item) => item.id === id);

    if (!car) {
      sendJson(res, 404, { error: "Voiture introuvable" });
      return;
    }

    sendJson(res, 200, car);
    return;
  }

  sendJson(res, 404, { error: "Route introuvable" });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
