.PHONY: build test fmt lint clean

GOLANGCILINT = $(shell go env GOPATH)/bin/golangci-lint

build:
	mkdir -p bin
	go build -o bin/factory ./cmd/factory

test:
	go test ./... -v

fmt:
	go fmt ./...

lint:
	$(GOLANGCILINT) run ./...

clean:
	rm -rf bin/