---
title: A static website on OpenBSD
date: 2025-08-06 14:00:00
summary: Running a copy of my 11ty website on OpenBSD using httpd and relayd.
tags: openbsd
---

Back in 2021 I was dipping my toes into the [world of OpenBSD](https://mijndertstuij.nl/posts/openbsd/). A few days ago I got the itch to try OpenBSD again, mostly because I'm kind of fed up with how little control I have over security headers and such on GitHub Pages. Since I have a Synology NAS with 32GB of RAM and plenty of storage, I decided to install VMM (Virtual Machine Manager) and run it there for a while.

## VMM 

Here's a really quick overview of how I set up the VM for OpenBSD:

1. Install VMM from the Synology Package Center
2. Open VMM, go to "Virtual Machine" and click "Create" 
3. Select Linux as the operating system 
4. Select your storage pool 
5. Give the VM a name and select the amount of RAM and CPU cores you want to allocate, leave everything else as default
6. Assign 40G of storage
7. For the network, select "Default VM network" 
8. For "ISO file for bootup" select the [OpenBSD ISO](https://mirror.leaseweb.com/pub/OpenBSD/7.7/amd64/install77.iso) you downloaded

Start the VM and click "Connect" to open the console. Follow the [installation instructions](https://www.openbsdhandbook.com/installation/), which are pretty straightforward. I chose to install OpenBSD on the whole disk, which is fine for this use-case.

## Doas

OpenBSD uses `doas` instead of `sudo` for privilege escalation. If you want to run commands as root, you can use:

```sh
doas <command>
```  

To allow your user to run `doas` to gain escalated privileges, you need to edit the `/etc/doas.conf` file. Add the following line:

```sh
permit persist yourusername
```

## HTTPD

OpenBSD comes with a built-in web server called `httpd`. To set it up, you need to create a configuration file at `/etc/httpd.conf`. You also need to create a directory for your website:

```sh
mkdir -p /var/www/htdocs/mydomain.foo.bar
chown yourusername /var/www/htdocs/mydomain.foo.bar
```

Here's my configuration for serving a static website:

```sh
server "mydomain.foo.bar" {
  listen on 127.0.0.1 port 8080
  root "/htdocs/mydomain.foo.bar"
  log style forwarded
  gzip-static
  location "/.well-known/acme-challenge/*" {
    root "/acme"
    request strip 2
  }
}

server "secure-redirect" {
  listen on * port 80 block return 301 "https://$HTTP_HOST$REQUEST_URI"
}
```

<aside><p>Notice the gzip-static directive, which enables gzip compression for static files. You can gzip your assets using the following command when building your static website:</p>

```sh
find dist/ -type f -exec gzip -9k "{}" \;
```
</aside>

To enable httpd and start it, run:

```sh
rcctl enable httpd
rcctl start httpd
```

## Relayd

Relayd can act as a reverse proxy to httpd to handle TLS termination and add security headers and such. It's installed by default, but you will need to create a configuration file at `/etc/relayd.conf`.

```sh
ipv4="your.ipv4.address"
table <local> { 127.0.0.1 }

http protocol https {
  tls keypair "mydomain.foo.bar"

  tls ciphers "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256"
  
  match request header append "X-Forwarded-For" value "$REMOTE_ADDR"
  match request header append "X-Forwarded-Port" value "$REMOTE_PORT"
  match response header set "Referrer-Policy" value "same-origin"
  match response header set "X-Frame-Options" value "deny"
  match response header set "X-XSS-Protection" value "1; mode=block"
  match response header set "X-Content-Type-Options" value "nosniff"
  match response header set "Strict-Transport-Security" value "max-age=31536000; includeSubDomains; preload"
  match response header set "Content-Security-Policy" value "default-src 'self'; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com; script-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com 'sha256-1jAmyYXcRq6zFldLe/GCgIDJBiOONdXjTLgEFMDnDSM=' 'sha256-ZswfTY7H35rbv8WC7NXBoiC7WNu86vSzCDChNWwZZDM=';"
  match response header set "Permissions-Policy" value "accelerometer=()"
  match response header set "Cache-Control" value "max-age=86400"
  
  return error
  pass
}
relay wwwtls {
  listen on $ipv4 port 443 tls
  protocol https
  forward to <local> port 8080
}
```

<aside>Make sure to replace `your.ipv4.address` with the actual IPv4 address of your server and adjust the `keypair` directive to match your TLS certificate setup.</aside>

To enable relayd and start it, run:

```sh
rcctl enable relayd
rcctl start relayd
```

## ACME client

ACME client can be used to automatically obtain a certificate from, in this case, Let's Encrypt.

```sh
cat <<EOT >> /etc/acme-client.conf
authority letsencrypt {
  api url "https://acme-v02.api.letsencrypt.org/directory"
  account key "/etc/acme/letsencrypt-privkey.pem"
}

domain mydomain.foo.bar {
  domain key "/etc/ssl/private/mydomain.foo.bar.key"
  domain full chain certificate "/etc/ssl/mydomain.foo.bar.fullchain.pem"
  sign with letsencrypt
}
EOF
```

You can now fetch the certificate by running:

```sh
acme-client -v mydomain.foo.bar
```

To automatically renew the certificate, add the following to `/etc/daily.local`:

```sh
next_part "Refreshing Let's Encrypt certificates:"
acme-client mydomain.foo.bar && rcctl reload relayd
```

## Rsync

To deploy your static website, you can use `rsync` to copy files to your OpenBSD server.

First, install `rsync` if it's not already installed:

```sh
pkg_add rsync
```

Then, create the configuration file at `/etc/rsyncd.conf`:

```sh
[global]
use chroot  = yes
max connection = 5
log file = /var/log/rsyncd.log

[mydomain.foo.bar]
path = /var/www/htdocs/mydomain.foo.bar/
read only = false
list = yes
uid = 1000
gid = 1
```

Finally, enable and start the rsync daemon:

```sh
rcctl enable rsyncd
rcctl start rsyncd
```

## PF 

For a basic firewall setup, you can use OpenBSD's Packet Filter (PF). You can find the PF configuration file at `/etc/pf.conf`. Here's an example that allows SSH, HTTP and HTTPS outbound.

```pf
cat <<EOT >> /etc/pf.conf
set skip on lo0
block all
pass in proto tcp to port { ssh http https }
pass out proto { tcp udp } to port { 22 53 80 123 443 }
pass out inet proto icmp icmp-type { echoreq }
pass proto ipv6-icmp from any to any
EOT
pfctl -f /etc/pf.conf
```

## Shutdown

To enable graceful shutdown of the VM, you need to install the qemu guest agent package. Without it you will not be able to properly shut down the VM from the Synology VMM interface.

```sh
pkg_add qemu-ga 
rcctl enable qemu_ga
```

## Conclusion

All in all this was a pretty painless experience. I was able to set up a copy of this website on OpenBSD with minimal effort using the built-in tools. Performance is generally pretty good, even though it's running on spinning disks that occassionally go to sleep.

Using this relayd config I now get an A+ on [Security Headers](https://securityheaders.com/), another A+ on [HTTP Observatory](https://developer.mozilla.org/en-US/observatory), and yet another A+ on [SSL Labs](https://www.ssllabs.com/ssltest/).

For my use, I'm not entirely sure yet whether I will keep this setup or not. Maybe I'll run my OpenBSD VM some place else like Hetzner or similar. It also depends on whether I actually want to deal with the sysadmin part of running a server. I do like the complete control I have over every single part of the stack.