FROM alpine AS compiler
RUN apk add gcc libc-dev
COPY hello.c /
RUN gcc /hello.c -o /hello

FROM alpine
COPY --from=compiler /hello /
CMD /hello
