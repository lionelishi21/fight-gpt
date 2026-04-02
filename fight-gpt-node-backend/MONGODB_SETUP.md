# MongoDB Setup Guide

## Connection String

Your MongoDB connection string format:

```
mongodb+srv://app_user:<db_password>@cluster0.f7ssjug.mongodb.net/fight_gpt?retryWrites=true&w=majority&appName=Cluster0
```

## Database Information

- **Username**: `app_user`
- **Cluster**: `cluster0.f7ssjug.mongodb.net`
- **Database Name**: `fight_gpt`
- **Connection Options**: 
  - `retryWrites=true` - Automatically retry write operations
  - `w=majority` - Wait for majority of nodes to acknowledge writes
  - `appName=Cluster0` - Application name for MongoDB Atlas monitoring

## Setup Instructions

1. **Create `.env` file** in the root directory:
   ```bash
   cp .env.example .env
   ```

2. **Replace `<db_password>`** with your actual database password:
   ```env
   MONGODB_URI=mongodb+srv://app_user:YOUR_ACTUAL_PASSWORD@cluster0.f7ssjug.mongodb.net/fight_gpt?retryWrites=true&w=majority&appName=Cluster0
   ```

3. **Verify the connection** by running:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   [INFO] MongoDB connected successfully to database: fight_gpt
   ```

## MongoDB Atlas Configuration

Make sure your MongoDB Atlas cluster has:

1. **Network Access**: 
   - Add `0.0.0.0/0` for development (allows all IPs)
   - Or add your specific IP address for production

2. **Database User**:
   - Username: `app_user`
   - Password: Your password
   - Database User Privileges: Read and write to `fight_gpt` database

3. **Database Collections**:
   The application will automatically create these collections:
   - `analyses` - Stores video analysis results
   - `auditlogs` - Stores API request audit logs

## Testing the Connection

You can test the MongoDB connection using the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Or check the logs when starting the server:
```bash
npm run dev
```

Look for: `MongoDB connected successfully to database: fight_gpt`

## Troubleshooting

### Connection Error: "authentication failed"
- Verify your password is correct (no special characters need URL encoding)
- Check that the username `app_user` exists in MongoDB Atlas

### Connection Error: "network timeout"
- Check your IP address is whitelisted in MongoDB Atlas Network Access
- Verify the cluster URL is correct: `cluster0.f7ssjug.mongodb.net`

### Connection Error: "database not found"
- The database `fight_gpt` will be created automatically on first connection
- If issues persist, manually create the database in MongoDB Atlas

### URL Encoding Password
If your password contains special characters, you may need to URL encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- etc.

Example:
```
Password: my@pass#123
Encoded: my%40pass%23123
MONGODB_URI=mongodb+srv://app_user:my%40pass%23123@cluster0.f7ssjug.mongodb.net/fight_gpt?...
```

