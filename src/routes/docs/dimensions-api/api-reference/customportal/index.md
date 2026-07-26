---
title: CustomPortal
date_created: 08-13-2022
last_updated: 08-13-2022
description: CustomPortal reference
---

# CustomPortal

## Creating a new portal

You should not create a CustomPortal since it should only be loaded by the [CustomPortalLoader](https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/customportal/CustomPortalLoader.html) from the **./plugins/Dimensions/Portals/** directory.

## Overriding portal

Addons should not have much control over the CustomPortal that is being loaded since they are supposed to _add_ features to Dimensions and not override them. But there are these methods that you can use to override Dimensions portals without too much work and event cancelling:

- [CustomPortal#setInsideBlockData(BlockData)](<https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/customportal/CustomPortal.html#setInsideBlockData(org.bukkit.block.data.BlockData)>)
- [PortalGeometry#setCustomGeometry​(CustomPortal, PortalGeometry)](<https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/completePortal/PortalGeometry.html#setCustomGeometry(me.xxastaspastaxx.dimensions.customportal.CustomPortal,me.xxastaspastaxx.dimensions.completePortal.PortalGeometry)>)
