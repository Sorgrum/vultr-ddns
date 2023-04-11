import React from "react";

export const useApiUrl = () => {
  const [apiUrl, setApiUrl] = React.useState("");
  React.useEffect(() => {
    const HOSTNAME = window.location.hostname ?? "localhost";
    const API_URL = `http://${HOSTNAME}:5000`;
    setApiUrl(API_URL);
  }, []);
  return apiUrl;
};
