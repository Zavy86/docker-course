# Entrypoint and command

> __entrypoint and command__
>
> - cmd
>   - multiple binaries
> - entrypoint
>   - single binary

In this chapter, we will see how to instruct Docker to execute a command when the container starts.

These two instructions, although very similar, have quite different use cases.

The first allows you to run a specific command, which is very useful when working with images that contain multiple
programs or applications you want the user to be able to execute.

The second allows you to set a fixed command, which still lets the user add parameters or arguments related to that 
command. This is more useful for images that contain a single program.

Let's see them in action...

***

Let's take the Dockerfile we created in the previous chapter and modify it:

```shell
$ nano Dockerfile
```

Let's add the command:

```dockerfile
FROM alpine
RUN [ "apk", "add", "figlet" ]
CMD figlet -f script "Welcome"
```

With the `CMD` instruction, we are setting a default command that will be executed when the container starts, unless 
another command is specified at runtime.

The `CMD` statement is considered metadata; it is not a command executed during the image build process, but only at 
runtime. Therefore, it does not matter if you place it at the top, middle, or bottom of the Dockerfile. However, keep in
mind that if you define it multiple times, the last one will always take precedence, overwriting the previous ones.

Let's exit, save the file, and rebuild the image:

```shell
$ docker build -t figlet .
```
```terminaloutput
[+] Building 0.1s (6/6) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 111B                                                                                                                                      0.0s
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 3)                                           0.0s
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                                           0.0s
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s
 => CACHED [2/2] RUN [ "apk", "add", "figlet" ]                                                                                                                           0.0s
 => exporting to image                                                                                                                                                    0.0s
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:e35f3599a6cfadf7530756eba187d1565756412975ffc3ae2c28d913bebdf607                                                                              0.0s 
 => => naming to docker.io/library/figlet                                                                                                                                 0.0s 
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 3)                                                       
```

As we can see, there is no trace of the command among the operations performed by the builder, because, as mentioned, it 
will be evaluated by the runtime and not during the build phase.

We can also notice a warning suggesting that it is better to use the JSON syntax for the command. Just like the `RUN` 
instruction, `CMD` also accepts JSON syntax, but for now, we can ignore this notification.

Let's run the container:

```shell
$ docker run figlet
```
```terminaloutput
 _              _                           
(_|   |   |_/  | |                          
  |   |   | _  | |  __   __   _  _  _    _  
  |   |   ||/  |/  /    /  \_/ |/ |/ |  |/  
   \_/ \_/ |__/|__/\___/\__/   |  |  |_/|__/
```

Unlike before, if we now try to run the container in interactive mode using the usual `-ti` parameter, we will notice 
that we no longer have access to the shell as we did previously.

This is because the Alpine image had `/bin/sh` as its default command, but now that we have defined a custom `CMD`, we 
have overridden the default command. Remember, the last one always takes precedence.

Therefore, if we want to regain access to the shell, we need to specify a new command at runtime to override what was 
defined in the Dockerfile:

```shell
$ docker run -ti figlet /bin/sh
```

Or even just `sh`, in any case the command must be entered after the image name.

As you will notice, we now have access to the `sh` shell and no longer receive the welcome message from Figlet.

***

Now, suppose we want to allow the user to customize the message displayed directly when starting the container. At this
point, the user could do so by overriding the command as follows:

```shell
$ docker run figlet figlet Hello Zavy
```
```terminaloutput
 _   _      _ _         _____                 
| | | | ___| | | ___   |__  /__ ___   ___   _ 
| |_| |/ _ \ | |/ _ \    / // _` \ \ / / | | |
|  _  |  __/ | | (_) |  / /| (_| |\ V /| |_| |
|_| |_|\___|_|_|\___/  /____\__,_| \_/  \__, |
                                        |___/ 
```

As you can see, we had to specify both the program name and its parameters after the image name.

If we want the `figlet` command to be implicit, possibly with a parameter to customize the font to use, we can use the
`ENTRYPOINT` instruction to define the default command and, at runtime, only provide the message we want to display.

Let's modify the Dockerfile again:

```shell
$ nano Dockerfile
```

This time, let's use the JSON syntax, primarily to avoid the warning, but not only for that reason:

```dockerfile
FROM alpine
RUN [ "apk", "add", "figlet" ]
ENTRYPOINT [ "figlet", "-f", "script" ]
```

When we run the container, the command specified in the `ENTRYPOINT` instruction will be executed. If an additional 
instruction is provided after the image name, it will be appended to the `CMD` and passed as arguments to the 
`ENTRYPOINT`.

But why did we use the `exec` (JSON) syntax instead of the `shell` form as before?

If we had used the basic shell syntax, the command would have been interpreted by the shell as 
`sh -c "figlet -f script"`, and since it is enclosed in quotes, we would not have been able to pass any additional 
parameters. By using the JSON form, the command is executed directly without shell interpretation, allowing us to add 
any further parameters.

Let's rebuild the image:

```shell
$ docker build -t figlet .
```
```terminaloutput
[+] Building 0.0s (6/6) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 120B                                                                                                                                      0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => CACHED [2/2] RUN [ "apk", "add", "figlet" ]                                                                                                                           0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:1e07b8999b54f162bc5bbd2d4664793c3639c393c42d3f230677efa82aeccab2                                                                              0.0s 
 => => naming to docker.io/library/figlet
```

Also in this case, as expected, nothing related to the entry point appears during the build phase...

Now let's run the container, this time passing only the message we want to display as a parameter:

```shell
$ docker run figlet Hello Zavy
```
```terminaloutput
 ,          _   _          __                   
/|   |     | | | |        (_ \                  
 |___|  _  | | | |  __       /  __,             
 |   |\|/  |/  |/  /  \_    /  /  |  |  |_|   | 
 |   |/|__/|__/|__/\__/    /__/\_/|_/ \/   \_/|/
                            /|               /| 
                            \|               \| 
```

And as we can see from the "fantastic font", the command entered has been concatenated to what was defined in the 
Dockerfile.

However, if we now try to run the container with the shell name at the end to enter interactive mode as we did 
previously:

```shell
$ docker run -ti figlet sh
```

We will notice something strange: instead of getting the `sh` shell, we received the word `sh` rendered by Figlet:

```terminaloutput
     _     
    | |    
 ,  | |    
/ \_|/ \   
 \/ |   |_/
```

This is because, as mentioned, if an `ENTRYPOINT` is present, any command passed at runtime will be inserted into the 
`CMD` and appended to it.

If we want to obtain a shell, we need to override the `ENTRYPOINT` instruction with the shell:

```shell
$ docker run -ti --entrypoint sh figlet
```

In this way, we have obtained the `sh` shell as expected.

If we then want to combine both instructions, we can modify the Dockerfile again:

```shell
$ nano Dockerfile
```

And insert both of them:

```dockerfile
FROM alpine
RUN [ "apk", "add", "figlet" ]
ENTRYPOINT [ "figlet", "-f", "script" ]
CMD [ "welcome" ]
```

Let's rebuild the image:

```shell
$ docker build -t figlet .
```
```terminaloutput
[+] Building 0.0s (6/6) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 120B                                                                                                                                      0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => CACHED [2/2] RUN [ "apk", "add", "figlet" ]                                                                                                                           0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:1e07b8999b54f162bc5bbd2d4664793c3639c393c42d3f230677efa82aeccab2                                                                              0.0s 
 => => naming to docker.io/library/figlet
```

In this way, if we do not specify any command, we will get the welcome message from Figlet:

```shell
$ docker run figlet
```
```terminaloutput
 _              _                           
(_|   |   |_/  | |                          
  |   |   | _  | |  __   __   _  _  _    _  
  |   |   ||/  |/  /    /  \_/ |/ |/ |  |/  
   \_/ \_/ |__/|__/\___/\__/   |  |  |_/|__/
```

Whereas if we specify a command, as we did before, we will get the customized message:

```shell
$ docker run figlet Zavy
```
```terminaloutput
 __                   
(_ \                  
   /  __,             
  /  /  |  |  |_|   | 
 /__/\_/|_/ \/   \_/|/
                   /| 
                   \| 
```

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)
> - [figlet-command](../../sources/figlet-command)
> - [figlet-entrypoint](../../sources/figlet-entrypoint)
> - [figlet-entrypoint-command](../../sources/figlet-entrypoint-command)

[Continue](../10-copying-files/IT.md) to the next topic.
