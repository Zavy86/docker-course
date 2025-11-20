# Application configuration

> __application configuration__
>
> - configuration size
> - optional parameters
> - mandatory parameters
> - scope of configuration
> - frequency of changes

Configuration management is one of the fundamental steps for deploying an application.

There are various ways to configure a containerized application. The choice of the most suitable method can depend on
several factors, such as the size of the configuration, the presence of optional or mandatory parameters, the scope of
relevance of the configuration, and the frequency with which the configuration needs to be updated.

Often, these factors are interconnected, and choosing the best solution is not straightforward.

In this chapter, we will explore some of the most common configuration types along with their pros and cons.

***

> __application configuration__
>
> command-line parameters
> - pros:
>   - mandatory parameters
>   - convenient for utilities
> - cons:
>   - dynamic or bigger

One possible method is to use command-line parameters, passing them directly via the `run` command, where an entrypoint 
will read, process, and configure the application accordingly before starting it.

This approach works well with mandatory parameters (without which the service cannot start).

It can be very useful for running utilities; for example, we have often used it with the `busybox` container.

It is very inconvenient for configurations that need to change dynamically or for very large configurations.

***

> __application configuration__
>
> environment variables
> - pros:
>   - optional parameters
>   - lots of parameters
>   - multiple services
> - cons:
>   - dynamic

Another approach is to use environment variables, which are key-value pairs that can be used to pass parameters to the
application.

They can be provided either from the command line or, more commonly, through the `docker-compose.yml` file.

They are very useful for optional parameters, which can be omitted without issues, allowing default values to be used.

They are suitable for configurations with many parameters, as you can specify only those you need.

They are convenient when you need to instantiate multiple services of the same type with different parameters.

It is very handy to be able to check the default values inside the image.

They are not the best choice for configurations that need to change dynamically.

***

> __application configuration__
>
> baked-in configuration
> - pros:
>   - single file
>   - stored in registry
> - cons:
>   - arbitrary customization
>   - require rebuild on change

Another method is to write the configuration directly inside the image, for example by copying a configuration file into
a specific directory within the image.

Each image would thus be preconfigured and ready to use.

They are easily customizable by modifying a single file.

The configured image can be saved directly in the registry and downloaded from any host.

There is a risk that a user could arbitrarily and unexpectedly modify the configuration by adding or removing parameters
as they wish.

With each configuration change, it will be necessary to rebuild the image and reload it into the registry.

***

> __application configuration__
>
> configuration volume
> - pros:
>   - shared configuration
>   - dynamically updatable
> - cons:
>   - arbitrary customization

The last method involves using a volume containing the configuration files, which must then be mounted on all containers 
that require that specific configuration.

Its main advantage is the ability to share the same configuration among multiple containers.

Changes can be made dynamically, and it is enough to restart the container if the service doesn't support auto-reloading
of configurations.

However, there is also the risk that a user could arbitrarily and unexpectedly modify the configuration by adding or 
removing parameters as they wish.

***

> __application configuration__
>
> - secrets
> - orchestrator

A final note on secrets, such as passwords, private keys, and other sensitive information.

Storing sensitive information inside images or configuration files saved in repositories is never a good practice.

Orchestration systems like Docker Swarm or Kubernetes provide specific methods for secure secret management, and it is 
always preferable to use these systems in production environments.

Unfortunately, without orchestration systems, managing secrets securely can be quite complex.

***

[Continue](../23-limiting-resources/README.md) to the next topic.
