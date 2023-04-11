const HOSTNAME = window.location.hostname ?? "localhost";
const PORT = process.env.API_PORT ?? 5000;
export const API_URL = `http://${HOSTNAME}:${PORT}`;
