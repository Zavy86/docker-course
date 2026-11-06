FROM busybox
#ENV DEMO_BUILD=test
COPY site/ /site/
COPY httpd.conf /etc/httpd.conf
CMD [ "httpd", "-f", "-p", "8080", "-h", "/site", "-c", "/etc/httpd.conf" ]
