# GitHub Pages Deployment

This site is ready to deploy as a static GitHub Pages site from the repository root.

## 1. Create or connect a GitHub repo

Create an empty repository on GitHub, then connect this local folder:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git add .
git commit -m "Launch portfolio site"
git push -u origin main
```

## 2. Enable GitHub Pages

In GitHub:

1. Open the repository.
2. Go to `Settings` -> `Pages`.
3. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
4. Choose branch `main` and folder `/root`.
5. Save.

GitHub will publish the site at:

```text
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

## 3. Add your domain

The `CNAME` file is already set to:

```text
aymanemaach.me
```

Commit and push that file with the rest of the site.

Add the custom domain in GitHub Pages before changing DNS. GitHub recommends verifying your domain too, because it helps prevent domain takeover problems.

For the domain DNS:

- Recommended if you want the `www` version too: use `www.aymanemaach.me`.
  Create a `CNAME` record named `www` pointing to `YOUR_USERNAME.github.io`.
- For the root domain `aymanemaach.me`, create these `A` records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

- If your DNS provider supports IPv6, you can also add these `AAAA` records:

```text
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

After DNS is saved, go back to `Settings` -> `Pages`, enter the custom domain, save, then enable `Enforce HTTPS` once GitHub allows it.
