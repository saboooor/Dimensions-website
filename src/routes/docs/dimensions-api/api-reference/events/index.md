---
title: Events
date_created: 08-13-2022
last_updated: 08-13-2022
description: Events reference
---

# Events

## [CustomPortalUseEvent](https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/events/CustomPortalUseEvent.html)

The event is fired when an entity or a player uses a portal and is ready to be teleported

If the event is cancelled the player will not be teleported

## [CustomPortalIgniteEvent](https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/events/CustomPortalIgniteEvent.html)

The event is fired when a portal is being ignited

If the event is canceled the portal will not be ignited

## [CustomPortalBreakEvent](https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/events/CustomPortalBreakEvent.html)

The event is fired when a portal is being broken

If the event is canceled the portal will not break

If you use the **Dimensions#getCompletePortalManager()#removePortal()**

Then you may want to revert the block states or the situation that caused the event because the portal will stay lit but the frame might be missing (in case you run the command when blocks break, etc)
