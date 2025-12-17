const dev = process.env.NODE_ENV !== "production";
export const server = dev ? "http://localhost:4001" : "https://technobase.in";
