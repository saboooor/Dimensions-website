---
title: Unbreakable addon
date_created: 07-27-2022
last_updated: 07-27-2022
description: Make a portal unbreakable by certain sources
---

# Unbreakable addon

## What does it do?

With Unbreakable addon, you can make a portal indestructible from specific sources such as creeper explosions, or make the portal only breakable by destroying its blocks (and not the inside part of it)

## How is it configured?

```yaml
Addon:
  Unbreakable:
    - "<input>"
```

\<input>:

- PLAYER_INSIDE # player attacks the portal inside (portal entity)
- PLAYER #the destroyer was a player (by breaking the blocks)
- ENTITY #the destroyer was an entity (creeper by explosion etc)
- DISPENSER #a dispenser destroyed the portal (currently dispensers do not break the portal)
- PISTON #a piston destroyed the portal
- BLOCK_PHYSICS #a block changed due to block behavior (dirt becomes grass etc)

{% hint style="info" %}
This option is a list. You can add more options by adding a new line and then another **- \<input>**
{% endhint %}
