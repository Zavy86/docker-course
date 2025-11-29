# History of Docker and containers

> __history of Docker and containers__
>
> - why containers
> - why Docker emerges

Hello Devs, and welcome to my new video course dedicated to the world of containers.

In this first chapter, we will not see how to use Docker in practice, but we will give a brief overview of the history 
of containers, why they have become so important in recent years, and what led us to Docker.

***

> __history of Docker and containers__
>
> - monolithic applications
> - long development cycles
> - single environment
> - slowly scaling up

The software development industry has changed.

There's no need to sugarcoat it: monolithic applications in single production environments were the norm for decades,
but today, thanks to increasingly advanced virtualization, systems have evolved significantly.

We can no longer afford solutions that are not very scalable and have long development times.

***

> __history of Docker and containers__
>
> - decoupled services
> - iterative improvements
> - multiple environments
> - quickly scaling out

Nowadays, applications are made up of many small services that work together and can be deployed in many different 
environments.

Business demands are faster and applications are increasingly developed in an iterative way.

Release speed and the ability to scale resources easily and quickly are fundamental requirements.

***

> __history of Docker and containers__
>
> - many different stacks
> - many different targets

This has led over time to a significant increase in the complexity of developing and distributing applications.

We now deal with various technology stacks, many more programming languages, frameworks, and databases.

And the distribution targets are also increasing, starting from individual developers' development environments, moving
through automated test environments, quality assurance, user acceptance tests, staging environments, and finally 
production.

***

> __history of Docker and containers__
>
> - on premise
> - in cloud
> - hybrid

And then, where do you deploy in production? On premise? In the cloud? In a hybrid environment?

All these options only create a hellish matrix that is always difficult to navigate.

***

> __history of Docker and containers__
>
> - reduction of costs
> - reduction of losses
> - maximization of production

If we try to draw a parallel with the transport industry, over time they have had to manage similar complexity.

Imagine different types of goods to be transported: small packages, boxes, sacks, barrels, crates, etc... All these 
goods have different sizes and their own way of being transported. Imagine having to use a different means of transport
for each type; it would be hardly scalable.

That's why Containers were invented: boxes of always the same size, with the same hooks and the same characteristics. 
Inside each one, you could put any type of goods, managing packaging, protection, and supports dedicated to each item
inside the container.

This made it possible to start mass production of containers and standardize means of transport, reducing costs, 
reducing losses, and giving rise to what is now called globalization.

Nowadays, over 5 thousand ships transport more than 200 million containers every year!

***

> __history of Docker and containers__
>
> - instructions
> - automations
> - Docker

Returning now to the software industry, over time, we have gone from developers releasing applications with simple text
files containing instructions for deployment.

Then came automation through scripts or more structured tools like Ansible, etc...

And finally, today, thanks to Docker, we can define a whole set of instructions for building a container and be sure 
that if it works locally, it will also work in production.

Finally solving the infamous _"It works on my machine!"_.

***

> __history of Docker and containers__
>
> - onboarding
> - testing
> - versioning

What are the strengths of Docker from a developer's perspective?

First of all, onboarding new team members.

Prepare a Docker file using official or custom images, describe the stack in a Docker Compose file, and commit 
everything to the project repository. This way, a new collaborator simply needs to clone the repository, run Docker 
Compose, and will be ready to start working in just a few minutes.

Then there's automated testing.

With a dedicated Docker Compose, we can easily run all tests in an isolated and secure environment. Each run can happen
in a clean and separate environment, without interfering with other tests. This ensures there is no data polluted by 
previous tests or failed run, and it's definitely more cost-effective than creating a new virtual machine for each test.

And let's not forget the speed of rollback in case of problems.

By working with Docker images, we have a complete environment available—not just the executable of our application, but
also all its dependencies and configuration. By maintaining versioning of the images, we can easily roll back to a 
previous version in case of issues with a new release, even if dependencies or configurations have changed.

***

> __history of Docker and containers__
>
> - standardization
> - distribution
> - deployment

But where does Docker come from, and why did containerization never become mainstream before its arrival?

Before Docker, there was practically no standardized method for building containers. Even though Linux systems already 
had all the basic components for building containers, such as chroot, cgroups, namespaces, etc., everything was very 
complex and difficult to manage.

Certainly not comparable to using a simple command like `docker run debian`!

Returning to the previous analogy, shipping containers are not just simple metal boxes; they are standardized metal
boxes, with the same size, the same holes, and the same hooks.

Before Docker, packages like `.deb`, `.rpm`, `.jar`, `.exe` were distributed, with an incredible number of problems due
to dependencies and configurations.

Thanks to Docker, we now distribute entire pre-packaged systems, not just applications and services. Obviously, this has 
an impact on the package size, but thanks to the layered distribution of images—which we will see later—we only need to 
distribute the parts that change, saving a lot of resources and time.

Before Docker, differences between development, test, and production environments were commonplace. Each had its own 
operating system, its own versions of libraries and dependencies, and its own configuration. It often happened that an 
application worked perfectly locally, gave warnings during testing, and crashed terribly once deployed to production.

Thanks to Docker, we can finally be 100% sure that if the application works locally, it will also work in test and 
production. We will have to manage other issues like pointers and networking, but we can be certain that the code 
developed and distributed is perfectly functional. In this way, we can automate many deployment processes, reducing
time and costs.

***

> __history of Docker and containers__
>
> - IBM VM/370 (1972)
> - FreeBSD jails (1999)
> - Linux VServers (2001)
> - Solaris Container (2004)
> - VPS age (2006)
> - PaaS period (2008)
> - Docker (2013)

To conclude this chapter, let's briefly retrace the history of containers.

The first experiments date back to 1972 with IBM's VM/370, in 1999 we have FreeBSD jails, in 2001 Linux implements 
VServers technology, and in 2004 Solaris also tries its hand.

After that, this technology seems to fade into obscurity for a while. In 2006, hardware virtualization takes center 
stage with the advent of VPS, in 2008 the first Platform as a Service solutions begin to emerge, and finally in 2013 at
PyCon in Santa Clara, Docker is presented to the public for the first time. But it will only be in 2016, after reaching 
version 1.0, that it will start to become a standard.

In those years, the OCI (Open Container Initiative) and the CNCF (Cloud Native Computing Foundation) are also born.

***

[Continue](../02-training-environment/README.md) to the next topic.
