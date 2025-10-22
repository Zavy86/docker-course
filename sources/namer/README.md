# Namer

This repository contains a simple web application project of a name generator.

## Instructions

Build the image:

```shell
$ docker build -t namer .
```

Run the development container:

```shell
$ docker run --rm -it -p 3000:3000 -v $(pwd):/app --name namer-dev namer
```

Open your browser to [http://localhost:3000/](http://localhost:3000/) to see the application.
