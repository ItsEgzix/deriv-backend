.PHONY: run validate clean test help

help:
	@echo "make run       - run the triage pipeline"
	@echo "make validate  - validate generated artifacts"
	@echo "make clean     - remove generated artifacts"
	@echo "make test      - run unit tests"

run:
	npm run triage

validate:
	npm run validate

clean:
	npm run clean

test:
	npm test
