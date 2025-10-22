# Namer

This repository contains a simple web application project of a name generator.

## Development instructions

Build the image:

```shell
$ docker build -t namer .
```

Run the development container:

```shell
$ docker run -it -p 3000:3000 -v $(pwd):/app --name namer-dev namer
```


