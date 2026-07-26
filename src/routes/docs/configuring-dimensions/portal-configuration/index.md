---
title: Portal configuration
date_created: 08-08-2022
last_updated: 08-08-2022
description: Configuring portals
---

# Portal configuration

#### Enable | default: true

Toggle the portal

#### DisplayName | default: Unnamed

The "pretty" way that the plugin talks about the portal

#### Portal.Frame.Mateiral | default: COBBLESTONE

The outside of the portal

#### Portal.Frame.Face | default: all

\['all','x','y','z','NORTH','EAST','WEST','SOUTH']

#### Portal.InsideMaterial | default: NETHER_PORTAL

The block that is going to fill the inside

#### Portal.LighterMaterial | default: FLINT*AN&#x44;*\_\_&#x53;TEEL

The item that ignites the portal

#### Portal.ParticlesColor | default: 0;0;0

r;g;b

#### Portal.BreakEffect | default: BLOCK_GLASS_BREAK

[Sounds](https://helpch.at/docs/1.9/index.html?org/bukkit/Sound.html)

#### Options.AllowedWorlds | default: \[] (empty list means that all worlds are allowed)

List all the allowed worlds. If you want to allow all worlds except a few, then list add the keyword 'all' and add the disabled worlds with '!' at the start of every world\
Example:

```
AllowedWorlds:
  - 'all'
  - '!world_the_end'
  - '!world_nether'
```

#### Options.BuildExitPortal | default: true

Allow exit portals

#### Options.TeleportDelay | default: 4

Delay before teleporting players

#### Options.EnableParticles | default: true

Emit particles from portals
