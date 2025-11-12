// Simulates API fetch with realistic delay
export async function mockFetch<T>(data: T, delay?: number): Promise<T> {
  const actualDelay = delay || Math.floor(Math.random() * 300) + 600; // 600-900ms
  await new Promise((resolve) => setTimeout(resolve, actualDelay));
  return data;
}
