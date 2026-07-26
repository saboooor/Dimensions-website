---
title: Particles addon
date_created: 07-23-2022
last_updated: 07-23-2022
description: Create particles that are being "emitted" by the portal
---

# Particles addon

## What does it do?

This addon gives you the ability to create particles that are being "emitted" by the portal. You can create your own "particle pack" and add it to your portal.

## How is it configured

First, you need to create the folder **./plugins/Dimensions/ParticlePacks** and create a **.yml** file inside of it.

That is the file that contains the particle behavior.The main body of the particle pack consists of 2 parts. The first one is the head(=start) and the second one is the body.

The head is a string list and is configured like so

```yaml
#this is an empty head, if you don't intend in using this,
#you don't have to include it in the file
start: []

#This is the head where we determine every how many server ticks,
#the "script will run"
start:
 - 'frequency = 20'
 - 'variable1 = 111'
 - 'x = 69'
 - 'exampleVariable = 22'
```

You can only use numbers with or without decimal points for a variable.\
for example x = 1, x=1.1, x=1.111111111, etc

Now that we have set up some of the variables we will be needing, we will now head to the body of the "pack". The body splits into two sections that each splits into two other sections as well.

The first one is **portal** and is used when we want to spawn particles based on the center of the portal, while the second one is **tile** and we use this when we want to spawn particles for every single portal entity/block.

After we decide which one we want to use we can choose between **for** and **play**. Both will run every time the "script" is called (which is every 20 ticks(=1 second) according to "frequency" we set above in **start**). Their difference is that we use **play** when we want something to run only once while **for** is used when we want a single line to run multiple times with different values in the variables.

The body is spaghetti of string lists and is configured like so:

```yaml
#This one will run everything in play for every portal entity a portal has
tile:
  play: [] #Here you will add your commands

#this one will run the for loop for an i=0 to 49.
portal:
  for:
    i=0;i<50;i=i+1: #this is an example of a for loop
      run0: [] #here you will add your commands
        #(run0 can be anything, make sure it's not a duplicate for each for)
```

The for loop is made from 3 parts seperated by ";"

The first part is where we initiate our variable with a value (in the example we do i =0)

The middle part is where we tell it how many times to run. The loop will run while the middle part is true. So in the example we run the loop while "i" is below 50.

The last part will be used to change "i". Every time the whole "code" inside of the loop is run, the variable "i" will become i+1 and will run until "i" is < 50

The available commands are:

- debug \<text>
- play \<particle type> \<x> \<y> \<z> \<count> \<offsetX> \<offsetY> \<offsetZ> \[DustOptions(Color(\<R>,\<G>,\<B>),\<size>)]

- The debug command will show variables but will not do any operations. If you want to output the result of an operation, save it in a variable first.
- You can find the available particle types [here](< https://hub.spigotmc.org/javadocs/spigot/org/bukkit/Particle.html>).
- DustOptions can only apply to redstone dust particles.

The for loops can have nested for loops inside of them.\
everything that is a child of for will run and if its a valid for loop everything inside of it will run aswell.

```yaml
tile/portal:
  for:
    i=0;i<3;i=i+1:
      run0:
        - "debug i"
      j=0;j<2;j=j+1:
        run0:
          - "debug i, j"
      run1:
        - "debug this will run after the loop above has been completed"
        - "debug it will run for every i, aka 3 times"
```

the output of this (for every \<frequency> ticks) will be:

```
0
0, 0
0, 1
this will run after the loop above has been completed
it will run for every i, aka 3 times
1
1, 0
1, 1
this will run after the loop above has been completed
it will run for every i, aka 3 times
2
2, 0
2, 1
this will run after the loop above has been completed
it will run for every i, aka 3 times
```

So if you used the command "play", instead of printing text, it would spawn particles instead.

If the for loop has not been set correctly and becomes an infinite loop, the server will crash.

Be careful when setting up the middle part of the for loop.

After you have created your pack, you can add it to a portal in its config like that:

```yaml
Addon:
  Particles:
    - "filename"
```

## Built-in variables

These are the variables you can use that are being given by Dimensions.

- locX - x-axis of the location
- locY - y-axis of the location
- locZ - z-axis of the location
- portalHeight - the height of the portal
- portalWidth - the width of the portal

The location depends on where it's used. If it's under the **tile** section, it will correspond to each portal entity, and if it's under the **portal** tile, it will be the center of the portal.

## Example

In this example, we will be making a particle pack that will create a circle around the portal.

First, we have the **start** block and we instantiate any variable we want to use.

```yaml
start:
  - "amount = 50"
  - "radius = 4"
  - "increment = (2 * 3.14) / amount"
  - "frequency = 20" #since the default is 20 ticks, we dont need to include this
```

Now that we have set up some of the variables we will be needing, we will now head to the main body of the "pack".&#x20;

For this example, we want to use a **for** loop, for the center of the portal, so we will use **portal**

So when we want to make a circle around the portal, we will have something like this:

```yaml
portal:
  for:
    i=0;i<amount;i=i+1:
      run0:
        - "angle = i * increment"
        - "x = locX + (radius * cos(angle))"
        - "z = locZ + (radius * sin(angle))"
        - "play REDSTONE x locY z 3 0 0 0 DustOptions(Color(0,255,0),2)"
```

and it would result into this:

![](/files/jsTIaXiBipSu47L0W3hO)

# Particles Editor

The portal inside the editor cannot be rotate **yet** and all particles will seem like they are in the same Z axis. Don't worry, they are not.

The particles editor is a tool that simulates the particles spawning. It's supposed to make creating particle packs easier

![Example of the editor](/files/sUuTSUNCD0IO9jqJ4qyV)

We are going to create the same example from [here](#example), but this time using the particle editor.

First, we have the **start** block and we instantiate any variable we want to use, which are:

- amount = 50
- radius = 4
- increment = (2 \* 3.14) / amount
- frequency = 20

In order to add these variables to the start block, we have to click at **start** in the **Explorer** and the **Assets** window will update to show us all the available options. We click at **Variable** and then at the right part of your screen you click on **Add**.

<div align="center"><img src="/files/2rXJAGIxG3JsJZWvONaU" alt=""></div>

After you have pressed **Add**, **tempVariable** will be added to **start**.

<div align="center"><img src="/files/P1GB9ufmaFdWASzohrcL" alt=""></div>

Now click at **tempVariable1** and look at the right of your screen.

![](/files/EFhQvEP690rGzUnT4VVA)

Now we change the name to **amount** and the value to **50** and we click **Save**.

We repeat that for all the variables we need, and we end up with:

![](/files/eEU2l88D3998qcc4WktE)

Now that we have set up some of the variables we will be needing, we will now head to the main body of the "pack".&#x20;

For this example, we want to use a **for** loop, for the center of the portal, so we will use **portal** and not **tile**

So in order to create a circle around the portal we will need these:

- A for loop where **i** starts with the value **0** and the for loop runs only while **i** is less than the **amount** (that we set at **start**). And after each run of the loop, we want to increase **i** by **1**.
- Inside the loop we need to add a runnable so we put some code to run and inside the runnable we add
- Inside the for loop we add these variables (to create a circle)\
  angle = i\* increment\
  x = locX + (radius \* cos(angle))\
  z = locZ + (radius \* sin(angle))
- And lastly we add a particle that plays **REDSTONE** at **x locY z 3 0 0 0** and has **DustOptions(Color(0,255,0),2)**

For the for loop we click at **portal->for** and then at the assets we click on **For loop** (it will add a runnable automatically) and we set it like that

![](/files/Pp6o9pzuso6z0Dyz6Oyb)

Then we add the variables inside the runnable and we end up with this:

![](/files/CYgHLaCFf4G388IOQ4FS)

Finally we add our particle which should look like this:

![](/files/wbi0W6jnVtAEvwuW3SDH)

And now if we click on **Run** it will show us how it will look in minecraft:

![](/files/IeWbpnBYchRVWTcWjptR)
