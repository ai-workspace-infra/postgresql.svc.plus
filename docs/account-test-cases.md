
swaks --server smtp.qq.com --port 465 --tls-on-connect \
  --auth LOGIN \
  --auth-user "manbuzhe2009@qq.com" \
  --auth-password "xxxxxxxxxxxxxxx" \
  --from "manbuzhe2009@qq.com" \
  --to "manbuzhe2008@gmail.com" \
  --header "From: XControl Account <manbuzhe2009@qq.com>" \
  --header "Reply-To: no-reply@svc.plus" \
  --data "Subject: XControl SMTP Test via QQ 465

Hello, this is a test email via smtp.qq.com SSL port 465.
✅ From header added correctly!"

