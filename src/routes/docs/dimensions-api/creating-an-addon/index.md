---
title: Creating an addon
date_created: 07-23-2022
last_updated: 07-23-2022
description: How to create an addon for Dimensions
---

# Creating an addon

{% hint style="info" %}
[Source code](https://github.com/xXastaspastaXx/Dimensions3) & [Javadocs](https://astaspasta.alwaysdata.net/javadocs)
{% endhint %}

## Main class

Your main class should extend [DimensionsAddon](https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/addons/DimensionsAddon.html)

{% hint style="info" %}
If you want to use the[ Dimensions events](https://astaspasta.alwaysdata.net/javadocs/me/xxastaspastaxx/dimensions/events/package-summary.html) then your class must also implement[ Listener](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/event/Listener.html)
{% endhint %}

## META-INF

When you are done coding, you have to let Dimensions know about the addon otherwise its not going to load it.

You need to create a few folders and files inside our **src** folder.

```
src
└───main
    └───java
        └───META-INF
            └───services
```

Inside the **services** folder you need to create a new file named:

```
me.xxastaspastaxx.dimensions.addons.DimensionsAddon
```

Finally, inside the file, enter the path to your main class as you would with **plugin.yml**

{% hint style="info" %}
This part is required by [ServiceLoader](https://docs.oracle.com/javase/8/docs/api/java/util/ServiceLoader.html) in order to load the addons properly
{% endhint %}
