export async function onRequestGet(context) {
  return new Response(
    JSON.stringify(
      {
        ok: true,
        service: 'toolmint-pages-function',
        mode: 'optional',
        note: 'The public tools work client-side. This endpoint is only a tiny health check starter for future use.',
        timestamp: new Date().toISOString(),
        colo: context.request.cf?.colo || null,
      },
      null,
      2,
    ),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}
