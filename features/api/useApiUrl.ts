import React from "react";

export const useApiUrl = () => {
  const [apiUrl, setApiUrl] = React.useState("");
  React.useEffect(() => {
    const HOSTNAME = window.location.hostname ?? "localhost";
    const PORT = process.env.API_PORT ?? 5000;
    const API_URL = `http://${HOSTNAME}:${PORT}`;
    setApiUrl(API_URL);
  }, []);
  return apiUrl;
};
