# Environment variables

> __environment variables and interpolation__
>
> - configure compose
> - configure the container
> - two different steps

If we were to use the same Compose project in multiple environments, we might need different settings for each one.
If we wrote all the values directly in the `compose.yaml` file, we'd have to modify the file every time we switch
environments.

With environment variables, we can reuse the same `compose.yaml` file and provide different values each time, for
example from the shell or from a `.env` file. Compose substitutes these values for the variable references while
preparing the configuration. This substitution is called **interpolation**.

If a value is needed by the application as well, we can pass it to the container with the `environment` section, and
the process running in the container will find it among its environment variables.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/env
```

Let's look at `compose.yaml` again.

```yaml
services:
  demo:
    image: "alpine:${TAG:-latest}"
    environment:
      MESSAGE: "${MESSAGE:-Hello by Compose}"
    command: ["printenv", "MESSAGE"]
```

In this script, we see a particular syntax for using a variable. We need to include the dollar sign symbol, followed
by a pair of curly braces, and inside, the name of the variable. Optionally, you can follow it with a dash and its
default value. In this case, the variable is called `TAG`, and if not specified, it defaults to `latest`.

The same applies to the `MESSAGE` variable, which defaults to `Hello by Compose` if not specified. The `printenv`
command is used to print the value of the `MESSAGE` variable and then exits.

Now with the command:

```shell
$ docker compose config
```
```terminaloutput
name: compose-env
services:
  demo:
    command:
      - printenv
      - MESSAGE
    environment:
      MESSAGE: Hello by Compose
    image: alpine:latest
    networks:
      default: null
networks:
  default:
    name: compose-env_default
```

Without any external settings, in the interpreted configuration we'll find `alpine:latest` and
`MESSAGE: Hello by Compose`.

Let's do a quick test by launching:

```shell
$ docker compose run --rm demo
```
```terminaloutput
Container compose-env-demo-run-6ce7644c98cc Creating 
Container compose-env-demo-run-6ce7644c98cc Created 
Hello by Compose
```

The `run` command lets us create and run a container. The `--rm` option removes it when the command finishes.

Here we expect the greeting, then a return to the terminal. We'll dive into `run` in the chapter on temporary
commands.

***

Now, still in the same directory, we create a file called exactly `.env`, including the initial dot:

```shell
nano .env
```
```dotenv
TAG=3.6
MESSAGE=Hello by .env
```

If we run the command again now:

```shell
$ docker compose config
```
```terminaloutput
name: compose-env
services:
  demo:
    command:
      - printenv
      - MESSAGE
    environment:
      MESSAGE: Hello by .env
    image: alpine:3.6
    networks:
      default: null
networks:
  default:
    name: compose-env_default
```

We'll see that Compose automatically loads the `.env` file and substitutes the value of the `MESSAGE` variable with
`Hello by .env`, without needing to specify anything manually.

If we run it, we'll see:

```shell
$ docker compose run --rm demo
```
```terminaloutput
[+] run 1/1
 ✔ Network compose-env_default Created                                                                              0.0s
Container compose-env-demo-run-dd5c3022b70e Creating 
Container compose-env-demo-run-dd5c3022b70e Created 
Hello by .env
```

If instead we wanted to set a variable temporarily directly in the shell, we can do that by prefixing the command
with the variable assignment, for example:

```shell
$ MESSAGE="Hello by shell" docker compose run --rm demo
```
```terminaloutput
Container compose-env-demo-run-dd5c3022b70e Creating 
Container compose-env-demo-run-dd5c3022b70e Created 
Hello by shell
```

In this way, the value is assigned to a single execution, and as you can see, no modification is made to the `.env`
file.

At the priority level, the variable in the shell overrides the value set in the file.

We can also have multiple `.env` files and choose which one to use, but in that case, we'll need to specify the name
explicitly when starting the stack.

Create a new file called `test.env`:

```shell
$ nano test.env
```
```dotenv
MESSAGE=Hello by test.env
```

And to use it, we use the `--env-file` option:

```shell
$ docker compose --env-file test.env run --rm demo
```
```terminaloutput
Container compose-env-demo-run-bd08de262530 Creating 
Container compose-env-demo-run-bd08de262530 Created 
Hello by test.env
```

And just as we would expect, the greeting changes again to show `Hello by test.env`.

Pay attention that the path for this option is relative to the directory from which we're running the command. Since
we're in the same directory, we can specify the file name directly. However, if we were writing a script and the
file wasn't in the specified path, we'd need to provide the relative or full path. If Compose can't find the file,
it will get stuck with an error and the stack won't start.

We can also pass the `--env-file` option multiple times, for example with:

```shell
$ docker compose --env-file .env --env-file test.env config
```
```terminaloutput
name: compose-env
services:
  demo:
    command:
      - printenv
      - MESSAGE
    environment:
      MESSAGE: Hello by test.env
    image: alpine:3.6
    networks:
      default: null
networks:
  default:
    name: compose-env_default
```

We can see that both files are read in the exact order specified, and if there are duplicate keys, the last one read
takes precedence. In this case, we first read `.env`, setting the image tag to `3.6` and the message to
`Hello by .env`. Then, we read `test.env`, which overwrote the message with `Hello by test.env`, integrating the
previous file.

In this case as well, the shell environment variable continues to take precedence:

```shell
$ MESSAGE="Hello by shell" docker compose --env-file .env --env-file test.env run --rm demo
```
```terminaloutput
Container compose-env-demo-run-f6cbef645183 Creating 
Container compose-env-demo-run-f6cbef645183 Created 
Hello by shell
```

***

> __interpolation defaults and required values__
>
> - defaults
> - required values
> - empty is not unset

In the examples we've seen so far, we've used variables with a default value. In many cases, this is a convenient
choice—if no value is specified, Compose uses the default.

However, in other cases, we might prefer to stop if the user doesn't specify a value.

Compose provides various syntax forms to manage environment variables:

- `${VAR:-valore}` uses the default value both when the variable is missing and when it is empty.
- `${VAR-valore}` only uses the default value when the variable is missing, an empty string is kept as is.
- `${VAR:?messaggio}` raises an error if the variable is either unset or empty.
- `${VAR?messaggio}` raises an error only if the variable is unset.
- `${VAR:+valore}` uses the value only if the variable is set and nonempty.
- `${VAR+valore}` uses it when the variable is set, even if it's empty.

***

To see these various forms in action, let's modify the `MESSAGE` in our compose file:


```shell
$ nano compose.yaml
```
```yaml
environment:
  MESSAGE: "${MESSAGE:?Set a value for MESSAGE in .env or shell}"
```

And let's temporarily remove the `MESSAGE` variable from the `.env` file:

```shell
$ nano .env
```
```dotenv
TAG=3.6
#MESSAGE=Hello by .env
```

If we launch our stack again now:

```shell
$ docker compose run --rm demo
```
```terminaloutput
error while interpolating services.demo.environment.MESSAGE: required variable MESSAGE is missing a value: 
Set a value for MESSAGE in .env or shell
```

We'll see that Compose will flag the error, indicating that the variable doesn't have a value, and it will show our
warning.

Now let's try passing an empty value from the shell for this variable:

```shell
$ MESSAGE= docker compose run --rm demo
```
```terminaloutput
error while interpolating services.demo.environment.MESSAGE: required variable MESSAGE is missing a value:
Set a value for MESSAGE in .env or shell
```

We'll run into the same exact error, however, if in the Compose file we went ahead and removed the colons:

```yaml
environment:
  MESSAGE: "${MESSAGE?Set a value for MESSAGE in .env or shell}"
```

And let's run the same command again:

```shell
$ MESSAGE= docker compose run --rm demo
```
```terminaloutput
Container compose-env-demo-run-005d238a9765 Creating 
Container compose-env-demo-run-005d238a9765 Created 

```

We'll just see an empty line with no errors.

Leave it to you to explore the other scenarios. And if you're wondering when it's useful to use the form with the
`+`, think about cases where you want to set a default value to pass to your application regardless of the value
assigned by the user. An example could be a flag to enable or disable debugging. In this case, maybe you just want
to force the values true or false, without giving the user the possibility to pass an arbitrary value.

In this case, we could use the form:

```yaml
environment:
  DEBUG: "${DEBUG:+true}"
```

So that the user only needs to specify the flag without necessarily knowing which value our application expects to
read.

***

Now let's create a new file `runtime.env`, still in the same directory:

```shell
$ nano runtime.env
```
```dotenv
MESSAGE=Hello by runtime.env
EXTRA=Another extra message
```

Then we modify the Compose file by adding the `env_file` option:

```yaml
services:
  demo:
    image: "alpine:${TAG:-latest}"
    env_file:
      - ./runtime.env
    environment:
      MESSAGE: "${MESSAGE:-Hello by Compose}"
    command: ["printenv", "MESSAGE"]

```

Now if we take a look, we find that we have a variable defined twice. Indeed, `MESSAGE` is defined both in the
`runtime.env` file and in the `compose.yaml`. Let's see how precedence works in this case.

```shell
$ docker compose config
```
```terminaloutput
name: compose-env
services:
  demo:
    command:
      - printenv
      - MESSAGE
    environment:
      EXTRA: Another extra message
      MESSAGE: Hello by Compose
    image: alpine:3.6
    networks:
      default: null
networks:
  default:
    name: compose-env_default
```

If we don't pass `MESSAGE`, the default from `compose.yaml` takes effect. Remember that we commented out the
variable in `.env`. The `environment` section takes precedence over values imported through `env_file`. If we
uncomment the line in `.env`, its value will take precedence over the default in the Compose file, just as we saw
earlier.

The resolved configuration also contains a new environment variable called extra. We can use it inside the
container, for instance by specifying the command ourselves.

```shell
$ docker compose run --rm demo printenv EXTRA
```
```terminaloutput
Container compose-env-demo-run-1c17aa0f5858 Creating 
Container compose-env-demo-run-1c17aa0f5858 Created 
Another extra message
```

In any case, the main advice to avoid issues with precedence is to always do a check before launching the stack with
the `config` command. This way, we'll eliminate any doubts.

***

> Resources:
>
> - [Environment variables in Compose](https://docs.docker.com/compose/how-tos/environment-variables/)
> - [alpine](https://hub.docker.com/_/alpine)

[Continue](../34-application-configs/README.md) to the next chapter.
