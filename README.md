# Streamfile Worker
File To Link Telegram Bot Using Cloudflare Workers.

<br>

## 🗂 Variables
```javascript
const BOT_TOKEN = "BOT_TOKEN"; // Insert your bot token.
const BOT_WEBHOOK = "/endpoint"; // Let it be as it is.
const BOT_SECRET = "BOT_SECRET"; // Insert a powerful secret text.
const BOT_OWNER = 123456789; // Insert your telegram account id.
const BOT_CHANNEL = -100123456789; // Insert telegram channel id.
const SIA_SECRET = "SIA_SECRET"; // Insert a powerful secret text.
const PUBLIC_BOT = false; // Make your bot public.
```

### Setup:
- Get `BOT_TOKEN` from [@botfather](https://t.me/botfather).
    - Turn on `inline mode` in bot settings.
    - Disable `inline feedback` for better results.
- Change `BOT_WEBHOOK` with your preferred webhook.
- Change `BOT_SECRET` with a powerful secret text (only `[A-Z, a-z, 0-9, _, -]` are allowed).
- Change `SIA_SECRET` with a powerful secret text using [password-generator](https://1password.com/password-generator).
- Change `PUBLIC_BOT` to make your bot public (only `[true, false]` are allowed).
- Get `BOT_OWNER` from [@idbot](https://t.me/username_to_id_bot).
- Get `BOT_CHANNEL` id by forwarding a message from channel to [@idbot](https://t.me/username_to_id_bot).
  - Channel **ID** must start with `-100`.
  - Bot must be **admin** in channel with **edit rights**.

<br>

## ⚙️Deploy
- Create a [Cloudflare](https://www.cloudflare.com/) **account**.
- Navigate to `Workers & Pages > Create > Create Worker`.
- Deploy the worker by clicking **Deploy**.
- Edit the code by clicking **Edit Code**.
- **Maunally:**
    - Upload `worker.js` into **Cloudflare**.
    - Modify the [variables](#-variables).
- **Dynamic:**
    - Generate the code using [code generator](https://vauth.github.io/filestream-cf/).
    - Copy paste the generated code to cloudflare workers.
- Finally, **Deploy**.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/vauth/filestream-cf)
### Setup:
- Once you deployed the bot on Cloudflare.
- Check `XXX.XXXX.workers.dev/getMe` to verify your bot authorization.
- Open `XXX.XXXX.workers.dev/registerWebhook` to register your bot webhook.
- Then you can start using your bot.

<br>

## 📚 Response
```python
Telegram Link: t.me/usernamebot/?start=GRJUYMDDJRFGK
Inline Link: @usernamebot GRJUYMDDJRFGK
Download Link: XX.XX.workers.dev/?file=GRJUYMDDJRFGK
Stream Link: XX.XX.workers.dev/?file=GRJUYMDDJRFGK&mode=inline
```

### Limitation:
- Telegram Link: `<4.00GB`
- Inline Link: `<4.00GB`
- Download Link: `<20.00MB`
- Stream Link: `<20.00MB`

<br>

## 📷 Screenshot

<a href="#Screenshot"><img src="https://github.com/user-attachments/assets/09101285-c68c-44a1-aaa1-e2d5c4c0cf90" width="300px"></a>
