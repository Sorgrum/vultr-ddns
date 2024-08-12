import server from "./server";

// **** Run **** //
const port = process.env.SYNC_SERVER_PORT ?? 3001;

const SERVER_START_MSG = "Express server started on port: " + port;

server.listen(port, () => console.log(SERVER_START_MSG));
