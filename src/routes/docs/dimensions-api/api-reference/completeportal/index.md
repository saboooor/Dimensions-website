---
title: CompletePortal
date_created: 08-13-2022
last_updated: 08-13-2022
description: CompletePortal reference
---

# CompletePortal

## Creating a new portal

When creating a new portal, you want to use:

```
Dimensions#getCompletePortalManager()#createNew()
```

If the portal is ready to be used. Otherwise, Dimensions will not count the portal and not teleport players.

Unless (for example) you want to create a temporary portal that will only exist as a placeholder for a forced teleport location.

## Portal tags

Portal tags are used to store data in the portal

- [CompletePortal#setTag](<https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/completePortal/CompletePortal.html#setTag(java.lang.String,java.lang.Object)>)
- [CompletePortal#getTag](<https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/completePortal/CompletePortal.html#getTag(java.lang.String)>)

For example the HubWorld addon stores the return location of players as a tag

## Is Active

When you run a task for a portal but it's not necessary to run while the portal is not active (the chunk is not loaded), then you should use [CompletePortal#isActive](<https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/completePortal/CompletePortal.html#isActive()>)
