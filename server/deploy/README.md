# Payment VM — AWS Lightsail deploy runbook

The payment backend (`server/`) runs on its own VM — **never on Vercel** — because it holds the Razorpay key secret, Firebase Admin service-account, and webhook secrets.

Target: Lightsail Ubuntu 24.04, Mumbai (`ap-south-1`), `micro_3_0` (1 vCPU / 1 GB, $5/mo) + free static IP. Caddy terminates TLS (auto-Let's-Encrypt) and proxies to Node on `127.0.0.1:8080`.

---

## 1. Create the instance (after `aws login`)

```bash
aws lightsail create-instances \
  --instance-names timber-payment \
  --availability-zone ap-south-1a \
  --bundle-id micro_3_0 \
  --blueprint-id ubuntu_24_04 \
  --region ap-south-1

aws lightsail allocate-static-ip --static-ip-name timber-payment-ip
aws lightsail attach-static-ip --static-ip-name timber-payment-ip --instance-name timber-payment

aws lightsail open-instance-public-ports \
  --instance-name timber-payment \
  --port-info fromPort=22,toPort=22,protocol=TCP \
  --port-info fromPort=80,toPort=80,protocol=TCP \
  --port-info fromPort=443,toPort=443,protocol=TCP

aws lightsail get-instance --instance-name timber-payment \
  --query 'instance.publicIpAddress' --output text
```

In the Lightsail console → Account → SSH keys, download the default key if you don't have it (`~/Downloads/LightsailDefaultKey-ap-south-1.pem`), then:

```bash
chmod 600 ~/Downloads/LightsailDefaultKey-ap-south-1.pem
```

## 2. DNS

Point an `A` record (e.g. `pay.yourdomain.com`) at the static IP. Wait for propagation before install step 5 — Caddy needs a valid DNS name to issue the TLS cert.

## 3. Ship the code up (secrets included, VM-side only)

```bash
rsync -avz --delete --exclude node_modules \
  -e "ssh -i ~/Downloads/LightsailDefaultKey-ap-south-1.pem" \
  server/ ubuntu@<STATIC_IP>:/opt/timber-payment/
```

`server/.env` must be present locally before this step (it is gitignored and lives only here + the VM). Fill in:

| Var | Value |
|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | live keys (already set) |
| `RAZORPAY_WEBHOOK_SECRET` | from Razorpay dashboard webhook (step 6) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | whole service-account JSON, one line |
| `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` | Shiprocket account |
| `SHIPROCKET_PICKUP_LOCATION` / `SHIPROCKET_PICKUP_PINCODE` | warehouse in Shiprocket |
| `SHIPROCKET_WEBHOOK_BASIC` | any `user:pass` you invent (step 7) |
| `SHIPROCKET_DEFAULT_WEIGHT_G` | fallback parcel weight, e.g. `2500` |
| `ALLOWED_ORIGIN` | `https://timber-website-alpha.vercel.app,http://localhost:3000` |

## 4. Bootstrap the VM

```bash
ssh -i ~/Downloads/LightsailDefaultKey-ap-south-1.pem ubuntu@<STATIC_IP>
sudo bash /opt/timber-payment/deploy/install.sh pay.yourdomain.com
```

## 5. Verify

```bash
curl https://pay.yourdomain.com/health          # {"ok":true}
journalctl -u timber-payment -f                 # app logs
systemctl status caddy                          # TLS issued
```

## 6. Razorpay webhook

Dashboard → Settings → Webhooks → **New webhook**:

- URL: `https://pay.yourdomain.com/webhooks/razorpay`
- Events: `payment.captured`, `payment.failed`, `refund.processed`
- Secret: generate a long random string → paste into `RAZORPAY_WEBHOOK_SECRET` in the VM's `/opt/timber-payment/.env`, then `sudo systemctl restart timber-payment`.

## 7. Shiprocket webhook

Shiprocket panel → Settings → Webhooks:

- URL: `https://pay.yourdomain.com/webhooks/shiprocket`
- Basic auth: set the same `user:pass` you put in `SHIPROCKET_WEBHOOK_BASIC`.

## 8. Point the storefront at the VM

Root `.env` **and** Vercel project env:

```
NEXT_PUBLIC_PAYMENT_API_URL=https://pay.yourdomain.com
```

Redeploy on Vercel after adding it.

## 9. End-to-end test

1. Place a real ₹1-style test order in production → pay.
2. Admin panel → order appears as **paid** → click **Approve & Ship** → status becomes **processing** with AWB.
3. Shiprocket panel → the shipment appears; movement pushes webhooks → order page / admin show **shipped → delivered**.
4. Test **Refund** on a paid order → status **refunded**.

## Updating the app later

```bash
rsync -avz --delete --exclude node_modules -e "ssh -i key.pem" \
  server/ ubuntu@<STATIC_IP>:/opt/timber-payment/
ssh ubuntu@<STATIC_IP> "sudo bash /opt/timber-payment/deploy/install.sh pay.yourdomain.com"
```
