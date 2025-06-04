from __future__ import annotations

"""Utility for writing rows to a Google Sheet.

Requires the following environment variables:

GOOGLE_SERVICE_ACCOUNT_JSON  = {
  "type": "service_account",
  "project_id": "search-sense",
  "private_key_id": "9a1881e9e630cdd5f371cb988d613c530f25cc63",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCUFWjyr2wCxhGx\nAJYhGDNZPjdKx5JeiOhq3WEJX0vvxyMRItDkRYhKzxduF1zDsQr9lIskOvu8YFAc\nODdZMqVqDZLrZd8fb5mp6+eRrevKNUBhDkbQF9JUwBOn/QVEArGtDduyT1yZ7U9/\nsvVuv95FLxXYDp7L9+M37FQc18ot7GIVtaEPRuCVqb9AbZZsiuxiY8mDBMaTFcca\nT5PHrW+uHLSCADHB1yROdBzpcQPhD1VxOS65E132SMtNPfyXggOh4ruVLnieBtOV\n7q7mF7+/XdI5JI7tzEKakThx30tKYrraPibiEajXupGHt8CN+9BEfjYoJGwR7XqK\nooCoZgHVAgMBAAECggEAN7XMS0zarjp06mnFkULJAqCI7a2iL8WC5r1NZdi/uT/q\nPeaivtY33akGcAkDAa4n69mH9UPpc+eqC8vMatbGa10a8ktbgziZj1csQd60D9kz\n1K+pzVzA6NhwLKlgY0M+M9Q8XFtGA7THTUv20MkHJnD931A0xpiGF4Jl7In0So0K\nTY1ug/yPDWCNyDcbPFZmmEA/StTseJP2b5YIz/WNQEGmLMt+ZwpgzUftaQ/2TUGN\n2hsNCn0hgqTsPKcGb+/hl8b/7neBNqnxKClzJ8mOLMXwG2LWZJ1myB3VU838GEj5\nvi0VJm0tIyW62NB5XV5MkXSINMZkMMvQR9C1qIqUewKBgQDQWGb48XqINg2O5xJX\nwLrf+vkbSao0xLFszd1fXt1UxPnaelfxlLOvx9JxQfFG4kp/kbZdGDScTkiplQ/B\n21SM3WKtjfqI/yzcu3Txraf4BkBY+4KQN9OynrSoexqlNAvVBfDXUcOfC+mrHnhT\nvMsipjbtL4fXFs5DKtO+stWSAwKBgQC19GcSYgOnzKxBSUeFzQ7R7252+ZAnSphX\nNYqV0tNXq1T3YNXzI4KuFoni1yicLV1MqLcfQc+veP3n4TY34U8ywGczYwVnAjNG\ntBKXIK7jj9oCwuJ16gymSqxSunHFp3qEQgg9OiHc4CcUZGKYjBAnY20WkYhZ05vt\nOjNCzN2BRwKBgQCR+O4kiyPbnWuAbPtYCkukNDYmXUVodUsOPWpVsKSICP45ibBm\nLVZ72RfjjF0c2d1yZcgMj7IEtYCJeEuy+hXSICZMDQa0x3xKJvi3f4EI8HBTJ9yB\naOvk4PcYeC/iAYYsuV3Vro7Nt03/O3j4ynTUkPo40i1tkKfxPWdf2/JwuwKBgDN1\nvtzlGZGQgjsopXDDEOjw5XYCmPFz2Gf5vYsoCBuoWixol7nfFit0NmUQYuzgq51t\nrfTKIRnIh07YVAQz1blNzyIqZDHA3o2lighx9uRnH8peIbwliJRTVC9Fib3T4wOa\nxUfDtCYKwyKyTWxFWKA7L3QNjtmQzm2mYy8GT7MrAoGBALoniBwZt2Ce7kjPh049\nwgHxoU+pAsiCDeHMP/3DCZTG3KGQohj/2XoDHysJC2Wt/Sdy3/FPgekuaTQ0Zvi6\nmBYKPlhkf+TRZhlbLu3SX+dapCxF97I+5WW4btBCvBiPddTkuZtD1bA3i2a13UYf\nQwzbhleV3XhYs8H9UmqO3cFq\n-----END PRIVATE KEY-----\n",
  "client_email": "street-meat-orders@search-sense.iam.gserviceaccount.com",
  "client_id": "117376502277739534756",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/street-meat-orders%40search-sense.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
GOOGLE_SERVICE_ACCOUNT_FILE = backend/secrets/service_account.json
GOOGLE_SHEET_ID = 1mlFK3JaakBPFV73wKeo90bYXD6USHYXEyYuBuo5pEsQ

If credentials are not supplied the module logs a warning and becomes a no-op
so that the rest of the API still works in local development.
"""

import json
import os
import logging
from datetime import datetime
from typing import Sequence

# Import Google client libraries lazily / defensively so the whole API still
# starts even if the optional dependency isn't installed in the current env.

try:
    from google.oauth2 import service_account  # type: ignore
    from googleapiclient.discovery import build  # type: ignore
    from googleapiclient.discovery import Resource  # type: ignore

except ModuleNotFoundError:  # pragma: no cover – optional dependency
    service_account = None  # type: ignore
    build = None  # type: ignore
    Resource = None  # type: ignore

LOGGER = logging.getLogger(__name__)

SCOPES = ("https://www.googleapis.com/auth/spreadsheets",)


def _get_credentials():
    if service_account is None:
        LOGGER.warning("google-auth libraries not installed; Google Sheets disabled")
        return None
    json_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if json_str:
        info = json.loads(json_str)
        return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)

    path = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
    if path and os.path.exists(path):
        return service_account.Credentials.from_service_account_file(path, scopes=SCOPES)

    # Fallback: look for a *.json credential file in the same directory
    default_path = os.path.join(os.path.dirname(__file__), "service_account.json")
    if os.path.exists(default_path):
        return service_account.Credentials.from_service_account_file(default_path, scopes=SCOPES)

    LOGGER.warning("Google credentials not configured; Google Sheets writes are disabled")
    return None


_creds = _get_credentials()
_service: Resource | None = (
    build("sheets", "v4", credentials=_creds, cache_discovery=False) if (_creds and build) else None
)
_sheet_id = os.getenv("GOOGLE_SHEET_ID")


def append_row(values: Sequence[str]):
    """Append a single row to the configured sheet.

    No-op if credentials/sheet id are missing.  Raises exceptions from the
    Google API otherwise.
    """
    if not _service or not _sheet_id:
        return  # no-op in dev

    body = {"values": [list(values)]}
    _service.spreadsheets().values().append(
        spreadsheetId=_sheet_id,
        range="Sheet1!A:Z",
        insertDataOption="INSERT_ROWS",
        valueInputOption="RAW",
        body=body,
    ).execute()


def append_order(user_name: str, menu_item: str, details: str | None, location: str):
    """Helper wrapper for the Order flow."""
    timestamp = datetime.utcnow().isoformat()
    append_row([timestamp, user_name, menu_item, details or "", location]) 