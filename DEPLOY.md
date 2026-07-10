# Kitchen Labels — Go Live Guide

This puts your label app on the internet with its own web address. You host
two things: the **app** (on Vercel) and the **database** (on Neon). Both have
free tiers that are plenty for a small catering business.

Everything technical has already been prepared. The steps below marked
**[You]** need your own accounts; the ones marked **[Claude can do]** I can
handle for you once you've made the accounts — just paste me the connection
details when you reach that point.

---

## What's already done

- Label PDFs fixed to work on Vercel's servers (font loading).
- Database connection made compatible with Neon's serverless pooler.
- A fresh security key (`AUTH_SECRET`) generated — see `deploy/SECRETS.txt`.
- The whole database exported to `deploy/labelapp-dump.sql` (all products,
  ingredients, brands, and every print list).
- The code committed to a local Git repository, ready to push.

---

## Step 1 — Create the database  **[You]**

1. Go to **neon.tech** and sign up (free).
2. Create a project (any name, region close to you, e.g. London).
3. On the project dashboard, find the **Connection string** and copy the
   **Pooled connection** one. It looks like:
   `postgresql://user:pass@ep-xxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require`

Keep that string handy — it's your `DATABASE_URL`.

## Step 2 — Load your data into Neon  **[Claude can do]**

Paste me the Neon connection string and I'll restore the full database export
into it (all your products and print lists), then set your login password to
something you choose. (Or, if you prefer to do it yourself, run:
`psql "<your-neon-string>" -f deploy/labelapp-dump.sql`.)

## Step 3 — Put the code on GitHub  **[You]**

1. Go to **github.com** and sign up (free).
2. Create a new **empty** repository called `kitchen-labels` (no README).
3. GitHub shows you two commands to "push an existing repository" — run them
   in the project folder. (I can give you the exact two lines; the final
   `git push` needs your GitHub login, which only you can enter.)

## Step 4 — Deploy on Vercel  **[You] + [Claude can advise]**

1. Go to **vercel.com** and sign up — choose **"Continue with GitHub"**.
2. Click **Add New → Project**, and import your `kitchen-labels` repo.
3. Before clicking Deploy, open **Environment Variables** and add two:
   - `DATABASE_URL` = your Neon pooled connection string (Step 1)
   - `AUTH_SECRET` = the key in `deploy/SECRETS.txt`
4. Click **Deploy**. After a minute or two you get a URL like
   `kitchen-labels.vercel.app`.

## Step 5 — Test it  **[You]**

Open the URL, log in with your email and the new password, load a print list,
press **Create a New Print Run**, and check the PDF prints correctly. Done.

---

## Notes

- **Custom web address:** you can later point your own domain (e.g.
  `labels.yourbusiness.co.uk`) at the Vercel site in a couple of clicks.
- **Updating the app:** once it's on GitHub + Vercel, any future change I make
  can be pushed and the live site rebuilds automatically.
- **Before relying on it operationally:** worth a final check of the label
  wording with your local Environmental Health Officer (Natasha's Law).
- **Cost:** Neon and Vercel free tiers cover this. If usage grows you'd move to
  a low-cost paid tier, but you're nowhere near that.
