# History of Docker and containers

![cover](https://img.youtube.com/vi/xxxxxxxxxxx/mqdefault.jpg)  
Watch on YouTube: [https://youtu.be/xxxxxxxxxxx](https://youtu.be/xxxxxxxxxxx)

> __history of Docker and containers__
>
> - why containers
> - why Docker emerges

Hello Devs, and welcome to this new video course dedicated to the world of containers.

In this first video, we won't see how to use Docker in practice, but we'll take a brief overview of the history of 
containers, why they've become so important in recent years, and what led us to Docker.

***

> __history of Docker and containers__
>
> - monolithic applications
> - long development cycles
> - single environment
> - slowly scaling up

The software development industry has changed.

There's no need to sugarcoat it: monolithic applications in single production environments were the norm for decades, 
but today things have changed.

We can no longer afford solutions that are hard to scale and have long development cycles.

***

> __history of Docker and containers__
>
> - decoupled services
> - fast, iterative improvements
> - multiple environments
> - quickly scaling out

Nowadays, applications are made up of many small services that work together and can be deployed in many different
environments.

Business demands are faster than ever, and applications must be developed iteratively.

Release speed and the ability to scale resources easily and quickly are fundamental requirements.

***

> __history of Docker and containers__
>
> - many different stacks
> - many different targets

This has greatly complicated the development and distribution of applications over time.

We deal with various technology stacks, many more programming languages, frameworks, and databases.

And the deployment targets are ever-increasing, starting from individual developers' environments, through automated 
test environments, quality assurance, user acceptance tests, staging, and finally production.

***

> __history of Docker and containers__
>
> - on premise
> - in cloud
> - hybrid

Where is production? Locally? In the cloud? In a hybrid environment?

All these options create a hellish matrix that's always hard to navigate.

***

> __history of Docker and containers__
>
> - reduction of costs
> - reduction of losses
> - maximization of production

If we draw a parallel with the transport industry, over time they also had to manage similar complexity.

Imagine various types of goods to transport: small packages, boxes, sacks, barrels, crates, etc...
All these goods have different sizes and their own way of being transported.
Imagine having a different means of transport for each type; it was hardly scalable.

So containers were invented: boxes of always the same size, with the same hooks and characteristics.
Inside, you can put any type of goods, handling packaging, protection, and supports for each item inside the container.

This allowed for maximizing container production and standardizing means of transport, reducing costs, losses, and
giving rise to what we now call globalization.

Nowadays, over 5000 ships transport over 200 million containers every year!

***

> __history of Docker and containers__
>
> - instructions
> - scripts
> - Docker

Let's go back to the software industry. Over time, we've gone from developers releasing applications with simple text
files containing production instructions.

Then came automation with scripts or more structured tools like Ansible, etc...

And finally, today, thanks to Docker, we can define a series of instructions for building a container and be sure that
if it works locally, it will work in production.

Finally solving the infamous "It works on my machine"!

***

> __history of Docker and containers__
>
> - onboarding
> - testing
> - versioning

But what are Docker's strengths from a developer's perspective?

First of all, onboarding new team members.

Prepare a Docker file using official or custom images, describe the stack in a Docker Compose file, and commit
everything to the project repository.
This way, a new collaborator just needs to clone the repository, run Docker Compose, and will be ready to start working
in minutes.

Then there's automated testing.
Thanks to a dedicated Docker Compose, we can easily run all tests in an isolated and safe environment.
Each run could happen in a clean, separate environment, without interfering with other tests.
Ensuring no data is polluted by previous tests or failed runs.
And it's definitely much cheaper than creating a new virtual machine for each test.

And let's not forget the speed of rollback in case of problems.
Working with Docker images, we have a complete environment, not just the application executable but also all its
dependencies and configuration.
By keeping versioning of images, we can easily roll back to a previous version in case of issues with a new release,
even when updating dependencies or changing configurations.

***

> __history of Docker and containers__
>
> - standardization
> - distribution
> - deployment

But where does Docker come from, and why did containerization never go mainstream before its arrival?

Before Docker, there was practically no standardized method for building containers.
Even though Linux systems already had all the basic components for building containers, like chroot, LXC, cgroups, etc.,
it was all very complex and hard to manage.

Definitely not comparable to using a simple command like `docker run debian`!

Going back to the previous analogy, shipping containers aren't just metal boxes; they're standardized metal boxes, with
the same size, holes, and hooks.

Before Docker, packages like `.deb`, `.rpm`, `.jar`, `.exe` were distributed, with an incredible number of problems due
to dependencies and configurations.
Thanks to Docker, we now distribute entire pre-packaged systems, not just applications and services.
Of course, this impacts the package size, but thanks to layered image distribution, which we'll see later, we only need
to distribute the parts that change, saving a lot of resources and time.

Before Docker, differences between development, test, and production environments were the norm.
Each had its own OS, library versions, dependencies, and configuration.
It often happened that an application worked perfectly locally, gave warnings during testing, and crashed terribly in
production.
Thanks to Docker, we can finally be 100% sure that if the application works locally, it will also work in test and
production. We'll still have to handle other issues like networking, but we can be sure the developed and distributed
code works.
This way, we can automate many deployment processes, reducing time and costs.

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

To conclude this video, let's quickly review the history of containers.

The first experiments date back to 1972 with IBM's VM/370, in 1999 we have FreeBSD jails, in 2001 Linux implements
VServers technology, and in 2004 Solaris tries its hand.

After that, this technology seems to fade a bit into obscurity. In 2006, hardware virtualization arrives with the rise
of VPS, in 2008 the first Platform as a Service solutions appear, and finally in 2013 at PyCon Santa Clara, Docker is
presented to the public for the first time. But it will only be in 2016, after reaching version 1.0, that it will start
to become a standard.

In those years, OCI (Open Container Initiative) and CNCF (Cloud Native Computing Foundation) are also born.

***

[Continue](../02-training-environment/README.md) to the next topic.