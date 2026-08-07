type Fetcher = {
  fetch(request: Request): Promise<Response>;
};

type D1Database = any;

declare module "cloudflare:workers" {
  export const env: {
    DB?: any;
  };
}
