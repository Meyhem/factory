# Factory

A console application built with Go for agentic coding tasks.

## Getting Started

### Prerequisites

- Go 1.23+

### Installation

```bash
git clone <repo>
cd factory
make build
./bin/factory
```

## Development

```bash
make fmt     # Format code
make lint    # Lint code
make test    # Run tests
make build   # Build binary
make clean   # Clean build artifacts
```

## Running the tests

```bash
make test
```

## Deployment

Build with `make build` and copy `bin/factory` to your PATH.