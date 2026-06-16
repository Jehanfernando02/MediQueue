#!/usr/bin/env python3
"""
MediQueue Health Monitor
========================
A lightweight operational script that polls the MediQueue API health endpoint,
logs response times, and exits with a non-zero code on failure (CI-compatible).

Usage:
    # Single check — exits 0 on success, 1 on failure
    python3 scripts/health_monitor.py

    # Target a specific URL
    python3 scripts/health_monitor.py --url https://mediqueue.onrender.com/api/health

    # Continuous watch mode — logs every 30 seconds
    python3 scripts/health_monitor.py --watch --interval 30

    # Fail after N consecutive errors (useful in alerting pipelines)
    python3 scripts/health_monitor.py --watch --max-failures 5
"""

import argparse
import json
import logging
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Logging — structured output readable by log aggregators (Datadog, CloudWatch)
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger("mediqueue.health_monitor")


# ---------------------------------------------------------------------------
# Core check
# ---------------------------------------------------------------------------
def check_health(url: str, timeout: int = 15) -> dict:
    """
    Perform a single HTTP GET against *url*.

    Returns a result dict:
        {
            "ok": bool,
            "status_code": int | None,
            "response_time_ms": float,
            "body": dict | None,
            "error": str | None,
            "timestamp": str (ISO-8601),
        }
    """
    start = time.monotonic()
    result = {
        "ok": False,
        "status_code": None,
        "response_time_ms": 0.0,
        "body": None,
        "error": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "MediQueue-HealthMonitor/1.0", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            elapsed = (time.monotonic() - start) * 1000
            result["status_code"] = response.status
            result["response_time_ms"] = round(elapsed, 2)

            raw = response.read().decode("utf-8")
            try:
                result["body"] = json.loads(raw)
            except json.JSONDecodeError:
                result["body"] = {"raw": raw}

            result["ok"] = response.status == 200

    except urllib.error.HTTPError as exc:
        elapsed = (time.monotonic() - start) * 1000
        result["status_code"] = exc.code
        result["response_time_ms"] = round(elapsed, 2)
        result["error"] = f"HTTP {exc.code}: {exc.reason}"

    except urllib.error.URLError as exc:
        elapsed = (time.monotonic() - start) * 1000
        result["response_time_ms"] = round(elapsed, 2)
        result["error"] = f"URL error: {exc.reason}"

    except TimeoutError:
        elapsed = (time.monotonic() - start) * 1000
        result["response_time_ms"] = round(elapsed, 2)
        result["error"] = f"Request timed out after {timeout}s"

    return result


# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------
def log_result(result: dict, attempt: int | None = None) -> None:
    prefix = f"[check #{attempt}] " if attempt is not None else ""

    if result["ok"]:
        env = result.get("body", {}).get("env", "unknown")
        version = result.get("body", {}).get("version", "?")
        logger.info(
            "%s✅ HEALTHY | HTTP %s | %.1f ms | env=%s ver=%s",
            prefix,
            result["status_code"],
            result["response_time_ms"],
            env,
            version,
        )
    else:
        logger.error(
            "%s❌ UNHEALTHY | HTTP %s | %.1f ms | error=%s",
            prefix,
            result["status_code"],
            result["response_time_ms"],
            result["error"],
        )


# ---------------------------------------------------------------------------
# Single-check mode
# ---------------------------------------------------------------------------
def run_once(url: str, timeout: int) -> int:
    """Run one health check. Returns shell exit code (0=ok, 1=fail)."""
    logger.info("Checking: %s", url)
    result = check_health(url, timeout)
    log_result(result)

    if not result["ok"]:
        logger.error("Health check FAILED — see details above.")
        return 1

    logger.info("Health check PASSED.")
    return 0


# ---------------------------------------------------------------------------
# Watch mode
# ---------------------------------------------------------------------------
def run_watch(url: str, interval: int, timeout: int, max_failures: int) -> int:
    """
    Poll indefinitely (or until Ctrl-C).
    Exits 1 if consecutive failures exceed *max_failures*.
    """
    logger.info(
        "Starting watch mode | url=%s | interval=%ds | max_consecutive_failures=%d",
        url,
        interval,
        max_failures,
    )

    consecutive_failures = 0
    total_checks = 0

    try:
        while True:
            total_checks += 1
            result = check_health(url, timeout)
            log_result(result, attempt=total_checks)

            if result["ok"]:
                if consecutive_failures > 0:
                    logger.info("Service recovered after %d failure(s).", consecutive_failures)
                consecutive_failures = 0
            else:
                consecutive_failures += 1
                logger.warning(
                    "Consecutive failures: %d / %d", consecutive_failures, max_failures
                )
                if consecutive_failures >= max_failures:
                    logger.critical(
                        "🚨 ALERT: %d consecutive failures reached — exiting with code 1.",
                        consecutive_failures,
                    )
                    return 1

            logger.debug("Sleeping %ds before next check...", interval)
            time.sleep(interval)

    except KeyboardInterrupt:
        logger.info("Watch mode stopped by user. Total checks: %d", total_checks)
        return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="health_monitor",
        description="MediQueue API health monitor — single check or continuous watch mode.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--url",
        default="https://mediqueue.onrender.com/api/health",
        help="Health endpoint URL (default: %(default)s)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=15,
        help="HTTP request timeout in seconds (default: %(default)s)",
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Run continuously instead of a single check",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=30,
        help="Seconds between checks in watch mode (default: %(default)s)",
    )
    parser.add_argument(
        "--max-failures",
        type=int,
        default=3,
        dest="max_failures",
        help="Max consecutive failures before exiting 1 in watch mode (default: %(default)s)",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.watch:
        return run_watch(
            url=args.url,
            interval=args.interval,
            timeout=args.timeout,
            max_failures=args.max_failures,
        )
    else:
        return run_once(url=args.url, timeout=args.timeout)


if __name__ == "__main__":
    sys.exit(main())
