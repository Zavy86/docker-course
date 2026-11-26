# Managing secrets

> __managing sensitive data with secrets__
>
> - explicit access
> - passwords and tokens
> - files, not printed values

If we were to provide a password or a token to one of our services, we might think about writing its value directly
into the project configuration. However, every time we shared that configuration, we would risk sharing the
credential with someone who doesn't need it.

When we're setting up the stack, we need to know how the services start and what settings they use. We also need to
know if a service requires a credential to function. We can make these details visible to the project team and
manage the credential value separately.

In Compose, we can do this by declaring credentials as **secrets**. In the configuration, we indicate the source of
each secret and choose which services to assign them to. This way, we can declare the source just once even when the
same credential is used by multiple services.

When we start the services, Compose makes the secrets assigned to each one available as files. The application can
read the file's content when it needs the credential to authenticate.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/secrets
```

And we create the file manually:

```shell
$ nano token.secret
```
```text
sample-secret-token
```

How can we see in this directory that we already have the _ignore_ files, which are used to ignore any files with a
`.secret` extension?

```shell
$ cat .dockerignore
$ cat .gitignore
```
```terminaloutput
*.secret
```

So files with this extension won't be passed to the Docker build context and won't ever be added to Git commits.

In a real project in these cases, it's a good practice to keep a file called `token.secret.sample` obviously
**empty** accompanied by instructions for creating your own private copy of the file.


Looking at the `compose.yaml` file:

```yaml
secrets:
  token:
    file: ./token.secret

services:
  demo:
    image: alpine
    secrets:
      - token
    command: >
      sh -c 'if test -r /run/secrets/token && test -s /run/secrets/token;
             then echo "Secret available";
             else echo "Secret missing or empty" >&2; exit 1;
             fi'
```

We'll revisit the structure in two parts, just as we did for configurations. At the top, we've declared the source,
then inside the `demo` service, we've assigned its access.

The secret named `token` becomes, in the short form, the file `/run/secrets/token` in the container.

The command launched is a small check: `test -r` verifies that the file is readable, and `test -s` ensures it's not
empty.

Only if both checks pass is the message `Secret available` printed. If either check fails, the command prints an
error in the terminal and exits with a code `1`.

So let's try running the container with the command:

```shell
$ docker compose run --rm demo
```
```terminaloutput
Container compose-secrets-demo-run-cbd4914c62ff Creating 
Container compose-secrets-demo-run-cbd4914c62ff Created 
Secret available
```

If the test fails, we check the source, ensure it's not empty, verify the path, and check the permissions.

To see how access is granted per service, let's temporarily remove the two `secrets` lines inside `demo`, keep the
top-level declaration and repeat the `run` command. The check will fail because declaring a secret alone doesn't
make it available to every service.

***

> __applications and the _FILE convention__
>
> - _FILE convention
> - the application must read the file
> - choose a different target when needed

The command in our example only reads the information needed to check the file's presence, but a real application
should instead open the file and use its content to authenticate.

Some images support environment variables with a `_FILE` suffix as a convention, for example, the official
PostgreSQL image allows you to configure the `POSTGRES_PASSWORD_FILE` option with the path to the secret containing
the password.

In these cases, the variable contains **the path**, not the password itself.

Obviously, appending the suffix `_FILE` to an existing application parameter doesn't make it capable of reading it;
we need to check the supported options for the image or the application.

If the program expects to find the token in a specific path, we can use the extended form of the `secret` map,
replacing the single `file` line with the two entries `source` and `target` as in this example:

```yaml
secrets:
  - source: token
    target: /full/token/path.ext
```

***

> __protecting local secret files__
>
> - local secrets are not a vault
> - protect files and backups
> - verify filesystem permissions

In any case, the word "secret" shouldn't give us a false sense of security. In regular local Compose, a `file`
source is mounted read-only, and Compose **does not encrypt the file on our disk** and does not handle expiration,
revocation, or renewal of credentials on its own.

The host administrator or the Docker daemon can access these data, and even the service that mounts them can read
them. If that service is compromised, the secrets can be exposed. Assigning secrets only where and when they are
needed reduces what we expose, but it doesn't replace host and application protection.

We need to remember to protect sources and backups, allowing access only to necessary users. On Linux, it counts on
owner, group, and permissions; on Windows, also ACLs and Docker Desktop sharing come into play. The process inside
the container must still be able to read the file; a very restrictive permission assigned to the wrong user would
block it.

As with configs, Compose doesn't apply `uid`, `gid` or `mode` to local secrets backed by `file`. It uses a bind
mount, so those attributes don't change the file's owner or permissions inside the container either. Let's check
access as the user that actually runs the service, without granting read access to everyone just to get past a
permissions problem.

The test with Alpine doesn't prove on its own that an application running as a non-root user has the same access
rights.

***

> __rotating credentials__
>
> - rotate the credential
> - update consumers
> - revoke the old value

Suppose we need to change the token, modifying only the `token.secret` file isn't enough.

In a real case scenario, we would first generate a new token for the service, then update the file on the host, and
subsequently restart the services that use it. We would then verify that everything works as expected, and finally
revoke the old token.

For persistent services that read the secret on startup, a possible application of the change is to use the
`--force-recreate` option followed by the name of the single service we want to restart. Be careful that if the
service is not replicated, we will incur an interruption, so plan these updates by notifying the users.

In some cases, for example with PostgreSQL as we saw before, changing the password file doesn't update the password
for an already initialized database. In that case, you'd also need to perform the operation expected by the
database, in addition to updating all the clients that connect to it.

***

> __secrets at build and runtime__
>
> - runtime and build are separate
> - avoid accidental disclosure
> - keep only safe examples

The last distinction to make is that the secrets assigned to the service are used at **runtime** when you run the
container.

They're not automatically available during the image build.

If the build needs to download a private dependency, we should use `build.secrets` instead of regular `secrets` and
a dedicated mount in the Dockerfile with `run --mount=type=secret`. We shouldn't pass the token with `ARG`, `ENV`,
or `COPY`, or we might accidentally leave it in the image or build metadata.

It's important, even with the correct mount, the command executed should never copy the secret or print it in debug.

The same applies at runtime—no `cat`ting the secret, no passwords in debug messages, and watch out for shared
output.

At the end of the test, as always, we launch a:

```shell
$ docker compose down
```
```terminaloutput
[+] down 1/1
 ✔ Network compose-secrets_default Removed                                                                          0.1s
```

To clean up everything, even though we launch the containers with the `--rm` option, other resources like networks
are still kept on the host. With `down`, we can be sure to delete the entire stack.

***

> Resources:
>
> - [Secrets in Compose](https://docs.docker.com/compose/how-tos/use-secrets/)
> - [alpine](https://hub.docker.com/_/alpine)

[Continue](../36-compose-overrides/README.md) to the next chapter.
