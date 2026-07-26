---
title: Example Addon
date_created: 08-13-2022
last_updated: 08-13-2022
description: Example addon for Dimensions
---

# Example Addon

{% hint style="info" %}
The source code for the example addon can be found [here](https://github.com/xXastaspastaXx/Dimensions3/blob/main/DimensionsExampleAddon/src/main/java/me/xxastaspastaxx/dimensions/addons/exampleaddon/DimensionsExampleAddonMain.java)
{% endhint %}

## Creating the project

Create a new project and add [Dimensions.jar](https://www.spigotmc.org/resources/dimensions-custom-portals.57542/) to your build path

## Creating the main class

```java
package me.xxastaspastaxx.dimensions.addons.exampleaddon;

import org.bukkit.event.Listener;

import me.xxastaspastaxx.dimensions.addons.DimensionsAddon;
import me.xxastaspastaxx.dimensions.addons.DimensionsAddonPriority;

public class DimensionsExampleAddonMain extends DimensionsAddon implements Listener {

	public DimensionsExampleAddonMain() {
		super(addonName, addonVersion, addonDescription, addonPriority); //Replace with whatever you want
	}

}

```

## Registering listener

Now we want to register our addon as a listener when the addon is being enabled so we add [onEnable](<https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/addons/DimensionsAddon.html#onEnable(me.xxastaspastaxx.dimensions.Dimensions)>)

```java
@Override
public void onEnable(Dimensions pl) {
	Bukkit.getPluginManager().registerEvents(this, pl);
}
```

## CustomPortalIgniteEvent

And finally we want to listen to the [CustomPortalIgniteEvent](https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/events/CustomPortalIgniteEvent.html) so we can summon the explosion particles. We use the EventHandler like we would in any other case.

```java

@EventHandler(ignoreCancelled = true, priority = EventPriority.NORMAL)
public void postPortalIgnite(CustomPortalIgniteEvent e) {
		//We check if the entity is a player, if its not we skip
		//If the player does not have permission, we also skip
		if (!(e.getEntity() instanceof Player) || !e.getEntity().hasPermission("dimensions.exampleaddon.explosion")) return;

		//Everything looks fine so we summon the explosion
		CompletePortal complete = e.getCompletePortal(); //We get the complete portal
		Location location = complete.getCenter(); //We get the center of the portal

		//We summon the particles
		location.getWorld().spawnParticle(Particle.EXPLOSION_NORMAL, location, 5);
}

```

## Finishing up

Now that we are done with coding, we have to let Dimensions know about our addon otherwise its not going to load it.

You need to create a few folders and files inside our **src** folder.

```
src
└───main
    └───java
        └───META-INF
            └───services
```

Inside the **services** folder we need to create a new file named:

```
me.xxastaspastaxx.dimensions.addons.DimensionsAddon
```

Finally, inside the file, enter the path to your main class as you would with **plugin.yml**

_for example in this case it would be_

```
me.xxastaspastaxx.dimensions.addons.exampleaddon.DimensionsExampleAddonMain
```

{% hint style="info" %}
This last part is required by [ServiceLoader](https://docs.oracle.com/javase/8/docs/api/java/util/ServiceLoader.html) in order to load the addons properly
{% endhint %}

## Done

Now you can put the addon you made inside **./plugins/Dimensions/Addons/** and restart your server.
