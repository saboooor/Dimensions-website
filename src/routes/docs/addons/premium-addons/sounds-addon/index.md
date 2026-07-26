---
title: Sounds addon
date_created: 07-16-2026
last_updated: 07-16-2026
description: Customize the sounds of your portals
---

# Sounds addon

This is an addon for the **Dimensions** plugin that allows server administrators to customize the specific sound effects played by custom portals for different events.

## Features

- **Granular Sound Control**: Set unique sound effects for four key portal events:
  - Igniting the portal
  - Traveling through the portal
  - Ambient humming while the portal is active
  - Breaking/deactivating the portal

## Installation

1. Copy the compiled `PortalSounds-4.0.2.jar` into your Paper/Spigot server's `plugins/Dimensions/addons/` directory.
2. Restart or reload the Dimensions plugin.

## Configuration

Add the sound settings under the `Addon.PortalSounds` block in any custom portal configuration file located in `plugins/Dimensions/Portals/` (e.g., `aether.yml`):

```yaml
Addon:
  PortalSounds:
    # Sound played when the portal is ignited/lit
    Ignite: "block.portal.travel"

    # Sound played when a player travels/teleports through the portal
    Travel: "block.portal.travel"

    # Sound played ambiently around active portal blocks
    Ambient: "block.portal.ambient"

    # How often the ambient sound plays in ticks (20 ticks = 1 second)
    AmbientFrequency: 80

    # Sound played when the portal frame or inside blocks are broken
    Break: "block.portal.trigger"
```

You can use any standard Minecraft sound key (e.g., `entity.enderman.teleport`, `block.glass.break`) or custom sound identifiers from a resource pack.
