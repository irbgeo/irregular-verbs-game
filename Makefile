.PHONY: dev test lint build deploy

# .env (not in git) may set MINI_APPS_APP_ID and other deploy variables.
-include .env
export

# dev: Vite dev server on http://localhost:5173 (outside VK the game uses browser storage).
dev:
	npx vite

# test: unit tests with coverage; fails below 70% (vitest.config.ts).
test:
	npx vitest run --coverage

lint:
	npx eslint . --fix
	npx tsc --noEmit

build: test lint
	npx vite build

# deploy: needs MINI_APPS_APP_ID; in CI also MINI_APPS_ACCESS_TOKEN (see README).
deploy: build
	@test -n "$$MINI_APPS_APP_ID" || { echo "MINI_APPS_APP_ID is not set"; exit 1; }
	npx vk-miniapps-deploy
