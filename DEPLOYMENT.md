# Deployment Guide

Follow these steps to deploy HistoryLens to Vercel with a secure backend proxy.

### 1. Deploy to Vercel
1. Push your code to a GitHub repository.
2. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
3. Import your HistoryLens repository.

### 2. Configure Environment Variables
1. In the Vercel project settings, navigate to **Settings > Environment Variables**.
2. Add a new variable:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key (starts with `sk-ant-`)
3. Click **Save**.

### 3. Enable Auto-Deploy
1. By default, Vercel enables GitHub auto-deployment. 
2. Every time you `git push` to your main branch, Vercel will automatically trigger a new build and deploy the changes live.

### 4. Verify the Proxy
1. Open your deployed URL.
2. Perform a search for any year.
3. Open the browser **Developer Tools > Network tab**.
4. Locate the request to `/api/history`.
5. Verify that the `x-api-key` header is **NOT** present in the Request Headers.
6. The API key is now handled securely on the server side.
