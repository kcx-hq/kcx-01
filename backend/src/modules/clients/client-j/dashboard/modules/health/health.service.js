export async function getHealthStatus() {
  return {
    success: true,
    message: "Client-J dashboard API is available",
    version: "1.0.0",
  };
}

