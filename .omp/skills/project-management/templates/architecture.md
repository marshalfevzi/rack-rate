<!-- dest: ARCHITECTURE.md -->
# Architecture

## Module graph

Describe modules and their directed dependencies. Keep the graph acyclic where boundaries require it.

```text
[entrypoint] -> [application] -> [domain]
[application] -> [ports]
[adapters] -> [ports]
```

## Boundary rules

State ownership, dependency direction, public interfaces, data crossing each boundary, and rules
for preventing UI, infrastructure, or persistence details from leaking into the domain.

## Subsystems

### Subsystem name

Describe responsibility, inputs, outputs, invariants, and failure behavior.

## Data flow

Describe the end-to-end flow from input through validation, processing, persistence, and output.

## Operations and commands

Document local and production operations, migrations, observability, recovery, and the commands
used to build, verify, deploy, and diagnose the system.
