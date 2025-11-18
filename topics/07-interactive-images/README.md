# Building images interactively

> __building images interactively__
>
> - our first image
> - install a new package
> - commit, tag, diff 

In this chapter, we will see how to create our first Docker image interactively.

We will start from a base image to run our container, then proceed with the installation of a package—specifically, the
usual Figlet seen previously—and finally save everything into a new Docker image.

By performing these operations, we will have the opportunity to see how the Docker `commit`, `tag`, and `diff` commands
work.

***

Let's begin, as shown in previous chapters, by running a container in interactive mode:

```shell
$ docker run -ti alpine
```

Once Alpine has started, proceed again with the installation of Figlet:

```shell
$ apk add figlet
```
```terminaloutput
fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/main/aarch64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/community/aarch64/APKINDEX.tar.gz
(1/1) Installing figlet (2.2.5-r3)
Executing busybox-1.37.0-r18.trigger
OK: 8 MiB in 17 packages
```

Let's make sure everything worked correctly by running the following command:

```shell
$ figlet "Hello"
```
```terminaloutput
 _   _      _ _       
| | | | ___| | | ___  
| |_| |/ _ \ | |/ _ \ 
|  _  |  __/ | | (_) |
|_| |_|\___|_|_|\___/ 
```

At this point, exit the container by typing `exit` and use the `docker diff` command to see the differences between the
recently stopped container and the original image:

```shell
$ docker ps -al
$ docker diff 87b
```
```terminaloutput
C /etc
C /etc/apk
C /etc/apk/world
C /root
A /root/.ash_history
C /lib
C /lib/apk
C /lib/apk/db
C /lib/apk/db/installed
C /lib/apk/db/scripts.tar
C /lib/apk/db/triggers
C /usr
C /usr/share
A /usr/share/figlet
A /usr/share/figlet/fonts
A /usr/share/figlet/fonts/ivrit.flf
A /usr/share/figlet/fonts/smshadow.flf
A /usr/share/figlet/fonts/646-dk.flc
A /usr/share/figlet/fonts/ushebrew.flc
A /usr/share/figlet/fonts/646-cn.flc
A /usr/share/figlet/fonts/646-es.flc
A /usr/share/figlet/fonts/frango.flc
A /usr/share/figlet/fonts/jis0201.flc
A /usr/share/figlet/fonts/646-kr.flc
A /usr/share/figlet/fonts/646-no.flc
A /usr/share/figlet/fonts/koi8r.flc
A /usr/share/figlet/fonts/small.flf
A /usr/share/figlet/fonts/8859-2.flc
A /usr/share/figlet/fonts/8859-5.flc
A /usr/share/figlet/fonts/8859-9.flc
A /usr/share/figlet/fonts/bubble.flf
A /usr/share/figlet/fonts/8859-8.flc
A /usr/share/figlet/fonts/646-yu.flc
A /usr/share/figlet/fonts/646-ca.flc
A /usr/share/figlet/fonts/646-ca2.flc
A /usr/share/figlet/fonts/shadow.flf
A /usr/share/figlet/fonts/smslant.flf
A /usr/share/figlet/fonts/646-jp.flc
A /usr/share/figlet/fonts/646-es2.flc
A /usr/share/figlet/fonts/big.flf
A /usr/share/figlet/fonts/block.flf
A /usr/share/figlet/fonts/hz.flc
A /usr/share/figlet/fonts/646-pt.flc
A /usr/share/figlet/fonts/646-se.flc
A /usr/share/figlet/fonts/8859-3.flc
A /usr/share/figlet/fonts/ilhebrew.flc
A /usr/share/figlet/fonts/646-se2.flc
A /usr/share/figlet/fonts/8859-4.flc
A /usr/share/figlet/fonts/646-cu.flc
A /usr/share/figlet/fonts/lean.flf
A /usr/share/figlet/fonts/mnemonic.flf
A /usr/share/figlet/fonts/digital.flf
A /usr/share/figlet/fonts/script.flf
A /usr/share/figlet/fonts/646-gb.flc
A /usr/share/figlet/fonts/646-irv.flc
A /usr/share/figlet/fonts/646-de.flc
A /usr/share/figlet/fonts/646-fr.flc
A /usr/share/figlet/fonts/slant.flf
A /usr/share/figlet/fonts/standard.flf
A /usr/share/figlet/fonts/banner.flf
A /usr/share/figlet/fonts/upper.flc
A /usr/share/figlet/fonts/utf8.flc
A /usr/share/figlet/fonts/646-it.flc
A /usr/share/figlet/fonts/646-no2.flc
A /usr/share/figlet/fonts/646-pt2.flc
A /usr/share/figlet/fonts/smscript.flf
A /usr/share/figlet/fonts/8859-7.flc
A /usr/share/figlet/fonts/mini.flf
A /usr/share/figlet/fonts/moscow.flc
A /usr/share/figlet/fonts/term.flf
A /usr/share/figlet/fonts/uskata.flc
A /usr/share/figlet/fonts/646-hu.flc
C /usr/bin
A /usr/bin/chkfont
A /usr/bin/figlet
A /usr/bin/showfigfonts
A /usr/bin/figlist
C /var
C /var/cache
C /var/cache/apk
A /var/cache/apk/APKINDEX.3ec923cb.tar.gz
A /var/cache/apk/APKINDEX.96d0d294.tar.g
```

Docker tracks the changes made to the container's filesystem compared to the original image, much like Git does. Since 
the base image is read-only, all changes are saved in an upper layer. Files that are added are marked with the letter 
`A` (Added), those that are modified with `C` (Changed), and those that are removed with `D` (Deleted). When a file is
modified, Docker does not actually overwrite the original file but instead creates a copy in the upper layer and applies
the changes to this copy. This ensures the integrity of the base image and provides excellent startup performance.

With the `docker diff` command, we can see which files have been added, modified, or removed.

Now that we know what changes have been made, we can save everything into a new image with the following command:

```shell
$ docker commit 87b
```

The output of this command will return the ID of the newly created image:

```terminaloutput
sha256:d04de44212d57d10f5300cab64e1116ac4ba4a151cdb3e22e997813317906288
```

If we want to test it, we can start a new container based on this image:

```shell
$ docker run -ti d04
$ figlet "Hello Again!"
```

And as we can see, Figlet is present and fully functional right from the first startup:

```terminaloutput
 _   _      _ _            _               _       _ 
| | | | ___| | | ___      / \   __ _  __ _(_)_ __ | |
| |_| |/ _ \ | |/ _ \    / _ \ / _` |/ _` | | '_ \| |
|  _  |  __/ | | (_) |  / ___ \ (_| | (_| | | | | |_|
|_| |_|\___|_|_|\___/  /_/   \_\__, |\__,_|_|_| |_(_)
                               |___/                 
```

You will agree that using the image ID to start a container is not exactly ideal. To make things easier, we can assign a
name to our image, or more precisely, a `tag`.

There are two ways to do this: either directly during the commit phase by adding the desired tag name at the end, or by
using the dedicated tag command, making sure to specify the image ID and not the container ID.

```shell
$ docker commit 87b alpine-figlet
$ docker tag d04 alpine-figlet
```

In this way, to start our special version of Alpine with Figlet, we just need to type:

```shell
$ docker run -ti alpine-figlet
$ figlet Hello Tag!
```

And as we can see, everything works as expected:

```terminaloutput
 _   _      _ _         _____           _ 
| | | | ___| | | ___   |_   _|_ _  __ _| |
| |_| |/ _ \ | |/ _ \    | |/ _` |/ _` | |
|  _  |  __/ | | (_) |   | | (_| | (_| |_|
|_| |_|\___|_|_|\___/    |_|\__,_|\__, (_)
                                  |___/   
```

As we never tire of saying, doing things manually is always a bad idea.

In our work, we must learn to automate as much as possible; any process that needs to be repeated multiple times should
be automated, and this also applies to creating Docker images.

Therefore, building images interactively is fine for experimentation and for understanding how Docker works behind the 
scenes, but it is certainly not the approach we will use to create images for our projects.

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)

[Continue](../08-dockerfile-images/README.md) to the next topic.
