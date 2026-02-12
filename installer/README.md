# Whatpro Setup (Standalone Installer)

This folder is a portable installer. You can copy it to any machine and run `whatpro-setup` without the rest of the repo.

## How it works
- Uses the `docker/` folder in this directory.
- Reads `docker/stacks.json` to know which stacks to deploy.
- Generates env files and per-stack overrides.
- Can install, validate, update, remove, and backup.

## Run
```bash
./whatpro-setup
```

## Custom paths (optional)
```bash
WHATPRO_SETUP_DOCKER_DIR=/opt/whatpro-setup/docker \
WHATPRO_SETUP_STACKS_JSON=/opt/whatpro-setup/docker/stacks.json \
./whatpro-setup
```

## Folder layout
```
installer/
  whatpro-setup
  docker/
    compose.*.yml
    stacks.json
    .env.example
    envs/
```
