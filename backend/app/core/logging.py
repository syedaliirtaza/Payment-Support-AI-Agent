import logging


def configure_logging() -> None:
    """Configure application-wide logging so agent traces are visible on the console."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-5s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
    )
