## Logging

This project uses a logger that always writes to a **file** and can optionally print to the **console**. To avoid confusion, we keep two separate thresholds:

- **`LOG_LEVEL`** = the **recording threshold** (what gets generated / written to the log file).
- **`LOG_CONSOLE_LEVEL`** = the **display threshold** (what gets printed to the console), only when `LOG_CONSOLE=true`.

### Rules (unambiguous)

1) A message is **recorded** (written to the file) if:
- `level >= LOG_LEVEL`

2) A message is **printed to the console** if:
- `LOG_CONSOLE=true` and
- `level >= max(LOG_LEVEL, LOG_CONSOLE_LEVEL)`

> Important: `LOG_CONSOLE_LEVEL` cannot “force” `debug` logs to appear if `LOG_LEVEL=info`. In that case, debug logs are not generated at all.

### Cheatsheet

| Goal | LOG_LEVEL | LOG_CONSOLE | LOG_CONSOLE_LEVEL | Result |
|---|---:|---:|---:|---|
| Dev: full file, quiet console | debug | true | warn | file: debug+ / console: warn+ |
| CI: minimal useful signal | info | true | warn | file: info+ / console: warn+ |
| Quick console debugging | debug | true | debug | file: debug+ / console: debug+ |
| No console output | debug | false | (any) | file: debug+ / console: nothing |

Legend: `debug+` means `debug, info, warn, error` (all levels at or above that threshold).

### Supporting variables

- `LOG_FORMAT`: `pretty` or `jsonl` (file format)
- `LOG_COLOR`: `auto | true | false` (console coloring only)
- `LOG_DIR`: output directory for log files
- `LOG_API_MAX_BODY`: limit for API body dumps (truncate)
- `LOG_ATTACH_ALLURE`: controls attaching `execution.log` to Allure (separate from console)

### Recommended profiles

**Local development (`.env.dev`)**
```ini
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_COLOR=true
LOG_DIR=out/logs

LOG_CONSOLE=true
LOG_CONSOLE_LEVEL=warn

LOG_ATTACH_ALLURE=false
LOG_API_MAX_BODY=20000

# CI
LOG_LEVEL=info
LOG_FORMAT=jsonl
LOG_COLOR=false
LOG_DIR=out/logs

LOG_CONSOLE=true
LOG_CONSOLE_LEVEL=warn

LOG_ATTACH_ALLURE=true
LOG_API_MAX_BODY=50000