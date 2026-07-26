---
title: Third party addons
date_created: 11-01-2022
last_updated: 11-01-2022
description: Addons made by other developers
---

# IgniteByEvent addon (BETA)

This wiki is for IgniteByEvent addon v3.0.1-BETA

## What does it do?

Portals can now be ignited without only using an item

## How is it configured?

```yaml
Addon:
  IgniteByEvent:
    Enable: true
    Events:
      DropItem:
        #- 'diamond'
        #- 'iron_ingot'
        #- '<item name>'
      EntityDeath:
        #- 'sheep'
        #- 'player'
        #- '<entity type>'
```
