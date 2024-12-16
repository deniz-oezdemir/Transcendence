const WebSocket = require("ws");

describe("WebSocket Connection", () => {
  let ws;

  beforeAll((done) => {
    ws = new WebSocket("ws://localhost:8000/ws/game/1/");
    ws.on("open", () => {
      done();
    });
  });

  afterAll(() => {
    ws.close();
  });

  test("should connect to WebSocket server", (done) => {
    ws.on("message", (message) => {
      const data = JSON.parse(message);
      expect(data).toBeDefined();
      done();
    });

    ws.send(
      JSON.stringify({
        action: "move",
        player_id: 1,
        direction: 1,
      }),
    );
  });
});
