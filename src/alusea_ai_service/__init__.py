import os


def serve() -> None:
    """Start Sara for the live site. Behind a web server on the same machine, visitors' real addresses come through."""
    import uvicorn

    uvicorn.run(
        "alusea_ai_service.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        proxy_headers=True,
        forwarded_allow_ips=os.getenv("FORWARDED_ALLOW_IPS", "127.0.0.1"),
    )
