---
title: Patreon Cosmetics addon
date_created: 07-23-2022
last_updated: 07-23-2022
description: Gives cosmetic benefits to the users who have donated/subscribed to patreon
---

# Patreon Cosmetics addon

## What does it do?

The addon gives cosmetic benefits to the users who have donated/subscribed to patreon

## How is it configured?

The addon does not need to be configured, its plug & play. Players that have linked their minecraft & patreon accounts in the Dimensions website, will be able to use their benefits in the server.

The server owners are not obligated to use the addon but it would support the plugin if they did and as a Thank you they get to use the benefits in their own server. They can do so by setting the following values in the config.yml

```yaml
CosmeticsAddon:
  PlayerUUID: <your uuid>
  IgnitePortal: <cosmetic>
  DestroyPortal: <cosmetic>
  UsePortal: <cosmetic>
```

Currently there are only 5 comsetic options. But many more are coming very soon

- NOTHING - disables the effects
- FINAL_SPARK | use, destroy, ignite
- FILLING_THE_VOID | tick, use, destroy, ignite
- HEART_SEEKER | tick, use, destroy, ignite
- HUNGRY_HOUNDS | tick, use, destroy, ignite
- GLOWING_AURA | tick
- ANGRY_LLAMA | tick
- EXPLOSIONS | destroy, use
- LIL_RING | tick

The words after the effects have the following meaning:

- use = you can put it at UsePortal
- ignite = you can put it at IgnitePortal
- destroy = you can put it at DestroyPortal
- tick = you can put it at PortalTick
