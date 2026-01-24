const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: "./src/routes",
});

export async function dispatch(req: Request) {
    const match = router.match(req);
    if (match) {
        // You must manually combine the params with the request
        // since the raw fetch(req) won't have them.
        const reqWithParams = Object.assign(req, { params: match.params });

        // Call your stored handler
        const module = await import(match.filePath);
        return module[req.method](reqWithParams);
    }
    return new Response("Not Found", { status: 404 });
}