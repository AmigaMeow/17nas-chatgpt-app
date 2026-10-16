# Include inside the existing mcp.17nas.com HTTPS server block.
# Upload the owner-approved video to this exact path before reloading Nginx.
location = /demo/ipv6-demo-60s.mp4 {
    alias /var/lib/17nas-chatgpt-app/demo/ipv6-demo-60s.mp4;
    default_type video/mp4;
    add_header Cache-Control "public, max-age=3600" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
    access_log off;
    error_log /dev/null;
    limit_except GET HEAD { deny all; }
}
