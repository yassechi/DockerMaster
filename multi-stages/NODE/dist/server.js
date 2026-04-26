"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const PORT = Number(process.env.PORT || 3002);
const cars = [
    { id: 1, brand: "Peugeot", model: "208", year: 2022 },
    { id: 2, brand: "Renault", model: "Clio", year: 2021 },
    { id: 3, brand: "Tesla", model: "Model 3", year: 2024 }
];
function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
}
const server = node_http_1.default.createServer((req, res) => {
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
