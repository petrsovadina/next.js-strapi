import { env } from "@/env.mjs"

/**
 * This route handler acts as a private proxy for frontend requests with one goal:
 * - Hide the backend URL, so it cannot be accessed directly.
 *
 * It is a private proxy because it accesses Strapi API endpoints requiring Users-permissions (https://docs.strapi.io/cms/features/users-permissions)
 * authentication. Every user has a unique token, which is used to authenticate requests.
 *
 * Authorization tokens are injected on the client-side, based on NextAuth's session.
 */
async function handler(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const path = Array.isArray(slug) ? slug.join("/") : slug
  const isReadOnly = request.method === "GET" || request.method === "HEAD"

  const { search } = new URL(request.url)
  const url = `${env.STRAPI_URL}/${path}${search ?? ""}`

  const clonedRequest = request.clone()
  // Extract the body explicitly from the cloned request
  const body = isReadOnly ? undefined : await clonedRequest.text()

  return fetch(url, {
    headers: {
      // Convert headers to object
      ...Object.fromEntries(clonedRequest.headers),
    },
    body,
    // this needs to be explicitly stated, because it is defaulted to GET
    method: request.method,
  })
}

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as POST,
  handler as PUT,
}
