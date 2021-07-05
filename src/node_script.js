const io = require("socket.io-client");
const MaxApi = require("max-api");

const socket = io("http://localhost:3000", { reconnectionDelay: 5000 });

MaxApi.post("started");

socket.on("connect", () => {
  MaxApi.post("connected");
});
socket.on("disconnect", () => {
  MaxApi.post("disconnected");
});
socket.on("error", () => {
  MaxApi.post("error");
});
socket.on("reconnecting", () => {
  MaxApi.post("reconnecting");
});
socket.on("connect_error", () => {
  MaxApi.post("error connecting");
});

socket.on("hello", (message) => {
  MaxApi.post(message + "from server");
  sendMessageToLive("fromTheInternet", "");
});

const sendMessageToLive = (messageType, data) => {
  MaxApi.outlet(messageType, JSON.stringify(data));
};
