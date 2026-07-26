---
title: Proxy addon
date_created: 10-31-2022
last_updated: 10-31-2022
description: Does whatever Dimensions does, but between servers and worlds
---

# Proxy addon

## What does it do?

This addon does whatever Dimensions does, but between servers and worlds.

# Bungee setup

First, you need to put DimensionsBungee.jar inside the plugins folder in your proxy.

Now, you need to open **./plugins/DimensionsBungee/config.yml** and set the following to whatever suits your needs

```
fallbackServer: <your main server where you want players to travel if the portal cannot find a destination portal>
Portals:
 - '<portalName>-><server>'
#- 'examplePortal->serverOne'
#- 'otherPortal->netherServer'
#- '<portalName>-><serverName>' #This will teleport the player to the specified server when the specified portal is used, and if the portal used is in <serverName> then the player would be teleported in the fallbackServer mentioned in the config
#- '<serverFrom>-><portalName>-><serverName>' #Now this will work like the above but if the portal used was in the <serverFrom> it will ALWAYS teleport to <serverName> no matter what
```

The portal name is the file name of the portal in every server and must be the same otherwise the plugin is not going to function properly

Now you need to move to your spigot/paper server to complete the setup

[Spigot/Paper setup](#spigotpaper-setup)

# Velocity setup

First, you need to put DimensionsVelocity.jar inside the plugins folder in your proxy.

Now, you need to open **./plugins/dimensionsvelocity/config.toml** and set the following to whatever suits your needs

```
config-version: "1.0.0" # This is important, it must be included BUT NOT MODIFIED
fallbackServer: "<your main server where you want players to travel if the portal cannot find a destination portal>"
Portals: [
    "<portalName>-><server>",
#   "examplePortal->serverOne",
#   "otherPortal->netherServer",
#   "<portalName>-><serverName>", #This will teleport the player to the specified server when the specified portal is used, and if the portal used is in <serverName> then the player would be teleported in the fallbackServer mentioned in the config
#   "<serverFrom>-><portalName>-><serverName>" #Now this will work like the above but if the portal used was in the <serverFrom> it will ALWAYS teleport to <serverName> no matter what
]
```

The portal name is the file name of the portal in every server and must be the same otherwise the plugin is not going to function properly

Now you need to move to your spigot/paper server to complete the setup

[Spigot/Paper setup](#spigotpaper-setup)

# Spigot/Paper setup

Now we are done with the the proxy, we move to our servers

You have to do this for your every server that you want dimensions to teleport between servers so you can make one and copy paste to the rest.

Dimensions & BungeeAddon MUST be installed in order for the plugin to work.

For every portal you create, you need to enable the bungee feature from the config like its shown below

```
  Bungee:
    Enable: true
    DestWorld: 'world' #DestWorld is the default world that the plugin will travel to (unless it has been linked to another portal in another world)
```

And you are done. Now when you use portals they will send you to the server that you set in the Dimesions Proxy config and the plugin will send the players to the world that you specified in each portal config.
