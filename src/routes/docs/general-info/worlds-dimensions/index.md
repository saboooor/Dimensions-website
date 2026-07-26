---
title: Worlds/Dimensions
date_created: 09-13-2022
last_updated: 09-13-2022
description: Worlds or dimensions (however you want to call them) can be either imported or generated.
---

# Worlds/Dimensions

Worlds or dimensions (however you want to call them) can be either imported or generated.

If you don't have a world you will need a world generation plugin such as [Multiverse-Core](https://www.spigotmc.org/resources/multiverse-core.390/) or [MyWorlds](https://www.spigotmc.org/resources/myworlds.39594/)

&#x20;Now, if you already have a world generated and you want to use that, you can put the world folder in your root server directory (where the rest of your worlds are and the spigot.jar or server.properties are) and use the name of the folder as the world in the portal config like that:

![](/files/6ATAlM7bt4hVSA0j0dgT)

In the **./plugins/Dimensions/config.yml** you can set the following:

```yaml
Worlds:
  <world name>:
    MinHeight: <min Y that you want portals to teleport to>
    MaxHeight: <max Y that you want portals to teleport to>
    Size: <the size of the world as if you were going to change the world border>
```

The min/max option is to set the min/max Y that portals will spawn (when building exit portals)

\
If the size is not set, then it grabs the world border's size and it's used to calculate the world ratio. (more info below)

<figure><img src="/files/DFXPUwafkbx0uPNWNH2I" alt=""><figcaption></figcaption></figure>
