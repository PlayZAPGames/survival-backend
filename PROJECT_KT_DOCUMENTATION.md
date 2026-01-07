# PlayZap Survival Backend - Complete Project Knowledge Transfer

**Project Name:** PlayZap Survival Backend  
**Version:** 1.0.0  
**Type:** Node.js Express Backend + Svelte Dashboard  
**Database:** PostgreSQL with Prisma ORM  
**Port:** 2032 (Default)  
**Environment:** Production & Staging

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema](#database-schema)
4. [Project Structure](#project-structure)
5. [Core Modules & Flows](#core-modules--flows)
6. [API Endpoints](#api-endpoints)
7. [Admin Dashboard Controls](#admin-dashboard-controls)
8. [Authentication & Authorization](#authentication--authorization)
9. [Key Features & Workflows](#key-features--workflows)
10. [Deployment & Configuration](#deployment--configuration)

---

## Project Overview

PlayZap is a **gaming platform** that combines blockchain integration (TON), user rewards, daily tasks, and an admin dashboard. The backend handles:

- **User Management:** Guest/Google/Apple/Telegram authentication
- **Game Management:** Multiple games with entry fees, rewards, and leaderboards
- **Currency System:** Virtual currencies (virtual1, virtual2), blockchain tokens (PZP(core/bsc))
- **Reward System:** Daily login bonuses, daily tasks, referrals, airdrops
- **Shop & Upgrades:** In-game items, store system, super powers
- **Blockchain Integration:** Wallet management, swaps, withdrawals, transactions
- **Admin Controls:** Full dashboard for managing users, games, rewards, airdrop campaigns
- **Analytics Dashboard:** User stats, game stats, activity tracking

---

## Architecture & Technology Stack

### **Backend Stack**
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (HS256)
- **Blockchain:** 
  - TON (TON Access, @ton/core, @ton/ton, @tonconnect/sdk)
  - EVM (Ethers.js v6)
- **Encryption:** Custom cipher (Base62/Cypher)
- **Scheduling:** node-cron, node-schedule
- **Third-party:**
  - Firebase Admin (user authentication)
  - Telegram Bot (Telegraf)
  - i18next (Internationalization - en, es, id, pt, pt_BR, ru)

### **Frontend (Dashboard)**
- **Framework:** Svelte 4
- **Build Tool:** Vite
- **Styling:** Custom CSS + FontAwesome icons
- **Routing:** svelte-spa-router
- **UI Components:** svelte-select, svelte-flatpickr, lucide-svelte, svelte-french-toast

### **Middleware & Security**
- **CORS:** Configured for Unity cross-origin support
- **Body Parser:** JSON & URL-encoded
- **JWT Verification:** UserMiddleware, AdminMiddleware with role-based access control
- **2FA:** Speakeasy + QR Code for admin authentication

---

## Database Schema

### **Core Tables**

#### **Users**
```prisma
Users {
  id (PK)
  socialId (Google/Apple/Telegram ID)
  loginType (guest|google|apple|telegram)
  username, imageUrl, imageIndex
  lastActive (epoch time)
  role (user|super user)
  status (0=active, 1=restricted, 2=blocked, 3=deleted)
  language (en, es, id, pt, pt_BR, ru)
  notification, botStart, isBlocked
  virtual1, virtual2 (currency balances)
  gamesPlayed, gamesWon
  fcmToken, token (unique)
  referree (JSON)
  createdAt, updatedAt
}
```

#### **Wallets**
```prisma
Wallets {
  id (FK: Users.id)
  pzpEvmWallet
  evmWalletPapi
  tonWallet
  isTonActive (Boolean)
}
```

#### **Games**
```prisma
games {
  id (PK)
  gameName, serverGameName, keyboardGameName
  url, miniAppUrl, iMessage_Solo
  entryFee, currencyType (virtual1|virtual2|free)
  winningCurrencyType
  kills, timeBonus, bossKills (multipliers)
}
```

#### **Daily Rewards**
```prisma
DailyRewards {
  id (PK)
  user_id (FK: Users)
  dailySession (JSON: {startAt, claimedDaysCount, lastClaimDate})
  createdAt, updatedAt
}
```

#### **Referral System**
```prisma
UserReferral {
  id (PK)
  referee (FK: Users)
  referrer (FK: Users)
  refereeAmount, referrerAmount
  redeem (Boolean)
  createdAt, updatedAt
}
```

#### **Daily Tasks**
```prisma
DailyUserTasks {
  id (PK)
  user_id (FK: Users, unique)
  user_name
  tasks (JSON array)
  createdAt, updatedAt
}

DailyTasksValues {
  id (PK)
  task_name, task_desc, task_pfp
  task_redirect, due_date
  reward, reward_range
  currency_type (virtual1|virtual2)
  status (InActive|Active)
  createdAt, updatedAt
}
```

#### **Games & Tournaments**
```prisma
Rooms {
  id (PK)
  name, iMessage, chatId
  maxPlayers, gameId, entryFee, currencyType
  released, freeEntry, releaseResponse
  startTime, releaseTime
  createdAt, updatedAt
}

UserTournament {
  id (PK)
  userId, tgId, iMessage, userName
  banned, score, scoreAry
  roomId (FK: Rooms)
  createdAt, updatedAt
}

UserTournamentScores {
  id (PK)
  userTournamentId (FK)
  userId, score, scoreAry, rank, points
  time, lives (3), timer (180s)
  stats (JSON), scoreSubmit, timerStarted
  createdAt, updatedAt
}
```

#### **Store & Items**
```prisma
StoreItem {
  id (PK)
  name, type (weapon|inventory)
  price, currencyType, description
  baseLevel (1), maxLevel (3)
  createdAt, updatedAt
}

ItemLevel {
  id (PK)
  itemId (FK: StoreItem)
  level, upgradeCost
  stats (JSON)
}

UserPurchase {
  id (PK)
  userId, itemId (FK)
  currentLevel (1), unlocked (Boolean)
}
```

#### **Super Powers**
```prisma
SuperPower {
  id (PK)
  name, description, price, icon
  isActive (Boolean)
}

UserSuperPower {
  id (PK)
  userId, superPowerId (FK)
  quantity
  createdAt, updatedAt
}
```

#### **Transactions & Wallet History**
```prisma
UserTransactions {
  id (PK)
  user_id, amount, currency
  operation (credit|debit)
  transaction_hash, transaction_type
  status (pending|success|failed)
  createdAt, updatedAt
}

UserWalletHistory {
  id (PK)
  user_id, item_id, from_amount, from_currency
  operation, transaction_hash, transaction_type
  status, to_amount, to_currency, to_address
  createdAt, updatedAt
}
```

#### **Admin & Logging**
```prisma
admins {
  id (PK)
  email (unique), encrypted_password
  name, player (0=super_admin, 1=admin, 2=manager, 3=partner)
  qr (2FA setup), keypass (OTP secret)
  reset_password_token, reset_password_sent_at
  remember_created_at
  modifiable_id, modifiable_type
  createdAt, updatedAt
}

admin_login_logs {
  id (PK)
  admin_id (FK), ip_address, ip_address_2
  login_time, created_at, updated_at
}

activities {
  id (PK)
  userId (FK: Users), refId, activity_type
  detail (JSON), wallet_history_id
  createdAt, updatedAt
}

UserGameRewardHistory {
  id (PK)
  seasonId, userId, gameId, roomId
  reward, rank, currency (virtual1|virtual2|pzp_core)
  reason (win|bonus|referral)
  createdAt
}
```

#### **Spinner**
```prisma
spin_wheels {
  id (PK)
  name, is_disabled
  perc (percentage), virtual1, virtual2 (rewards)
  created_at, updated_at
}

user_spin_wheels {
  id (PK)
  user_id, spin_wheel_id (FK)
  is_claimed, virtual1, virtual2
  created_at, updated_at
}
```

#### **Master Data**
```prisma
Master {
  key (unique)
  data1 (JSON), data2 (string/varchar)
}

Notifications {
  id (unique)
  data1 (NotificationsData)
}

NotificationsData {
  id, data (JSON)
}
```

---

## Project Structure

```
survival-backend/
├── index.js                          # Main entry point
├── package.json                      # Dependencies
├── config/
│   └── config.js                     # Configuration (commented, moved to .env)
├── controllers/                      # Business logic
│   ├── dailyloginBonus.js           # Daily login bonus logic
│   ├── dailyRewards.js              # Daily rewards
│   ├── dailyTasks.js                # Daily tasks management
│   ├── referral.js                  # Referral system
│   ├── shop.js                      # Shop & transactions (swaps, withdrawals)
│   ├── shopList.json                # Shop items data
│   ├── spinner.js                   # Spinner logic
│   ├── spinnerRewards.json          # Spinner rewards data
│   ├── store.js                     # Store items (weapons, inventory)
│   └── superPowers.js               # Super powers management
├── routes/                           # API routes
│   ├── auth.js                      # User authentication
│   ├── userApi.js                   # User profile & balance
│   ├── game.js                      # Game endpoints & leaderboard
│   ├── gameList.js                  # Game listings
│   ├── spinner.js                   # Spinner API
│   ├── referral.js                  # Referral API
│   ├── dailyRewardsApi.js           # Daily rewards API
│   ├── dailyLoginBonusApi.js        # Login bonus API
│   ├── dailytasks.js                # Daily tasks API
│   ├── shop.js                      # Shop & swap API
│   ├── storeRoutes.js               # Store API
│   ├── superPowerRoutes.js          # Super powers API
│   ├── earnLudyRoutes.js            # Earn Ludy (tasks & airdrop)
│   ├── transaction.js               # Transaction API
│   ├── master.js                    # Master data
│   ├── totalSupply.js               # PZP total supply
│   ├── adminDashboard.js            # Admin dashboard API
│   └── adminRoutes/                 # Admin-specific routes
│       ├── index.js                 # Router setup with role-based middleware
│       ├── loginRoute.js            # Admin login with 2FA
│       ├── dashboardRoutes.js       # Admin dashboard stats
│       ├── gameRoutes.js            # Admin game management
│       ├── userRoutes.js            # Admin user management
│       ├── airdropRoutes.js         # Airdrop campaigns
│       ├── settingRoutes.js         # Settings management
│       ├── spinnerRoutes.js         # Spinner configuration
│       ├── earnLudyRoutes.js        # Task management
│       ├── storeRoutes.js           # Store item management
│       └── superPowerRoutes.js      # Super power management
├── Transactions/
│   ├── getBalance.js                # Blockchain balance check
│   ├── mnemonic-privatekey.js       # Key management
│   └── rewardTransfer.js            # Blockchain transfers
├── ton-connect/                      # TON blockchain integration
│   ├── connector.js
│   ├── wallet.js
│   ├── commands-handler.js
│   ├── connect-wallet-menu.js
│   ├── storage.js
│   └── utils.js
├── utility/                          # Helper utilities
│   ├── tokenAuthService.js          # JWT & middleware
│   ├── walletService.js             # Wallet operations
│   ├── blockChainServices.js        # Blockchain interactions
│   ├── activityServices.js          # Activity logging
│   ├── airdropServices.js           # Airdrop logic
│   ├── cypher.js                    # Encryption & slug conversion
│   ├── enums.js                     # Constants & enums
│   ├── login.js                     # Login utilities
│   ├── defaultData.js               # Default data initialization
│   ├── gameController.js            # Game-specific logic
│   ├── commonMethods.js             # Shared methods
│   ├── verifyFirebaseToken.js       # Firebase verification
│   ├── restartCronJobs.js           # Cron job management
│   └── weeklyRewardCron.js          # Weekly reward distribution
├── middleware/
│   ├── index.js
│   ├── isAdmin.js                   # Admin check
│   ├── settingValidator.js          # Settings validation
│   └── validateResource/
│       └── index.js                 # Request validators
├── database/
│   ├── db.js                        # Database connection
│   └── dbQuery.js                   # Legacy database queries
├── prisma/
│   ├── db.js                        # Prisma client export
│   ├── schema.prisma                # Database schema
│   └── migrations/                  # Migration history
├── helpers/
│   ├── index.js                     # Response helpers
│   ├── makeResponse/
│   │   └── index.js                 # Response formatting
│   └── requestHandler/
│       └── asyncHandler.js          # Error handling wrapper
├── libs/
│   └── utils.js                     # General utilities
├── locales/                          # i18next translations
│   ├── en/translation.json
│   ├── es/translation.json
│   ├── id/translation.json
│   ├── pt/translation.json
│   ├── pt_BR/translation.json
│   └── ru/translation.json
├── public/
│   ├── notificationDash.js
│   ├── styles.css
│   └── profile_images/
├── dashboard/                        # Svelte admin dashboard
│   ├── src/
│   │   ├── App.svelte               # Main app
│   │   ├── main.js                  # Entry point
│   │   ├── app.css                  # Styles
│   │   ├── config.js                # Frontend config
│   │   ├── components/              # Reusable components
│   │   ├── pages/                   # Page components
│   │   ├── routes/                  # Route definitions
│   │   ├── stores/                  # Svelte stores
│   │   ├── utils/                   # Frontend utilities
│   │   └── assets/                  # Static assets
│   ├── vite.config.js
│   ├── svelte.config.js
│   └── package.json
└── .env                              # Environment variables
```

---

## Core Modules & Flows

### **1. Authentication Module** (`routes/auth.js`)

**Flow:**
1. User initiates login with `socialId` and `loginType` (guest/google/apple/telegram)
2. Optional `referralCode` for referral tracking
3. For Google login, Firebase verification
4. User lookup or creation
5. JWT token generation
6. Default wallet creation
7. Default store items unlocked

**Key Functions:**
- `POST /api/login` - User login/signup
- Guest to social account upgrade (existing guest → google/apple)
- Firebase token verification
- Referral code validation

**Token Structure:**
```json
{
  "userId": 123,
  "iat": timestamp,
  "exp": timestamp
}
```

---

### **2. User Management Module** (`routes/userApi.js`, `controllers/`)

**Features:**
- Get user balance (virtual1, virtual2)
- Account deletion (soft delete via status=3)
- User profile updates
- Last active timestamp tracking
- Maintenance mode bypass for admins/super users

**Transaction Types:**
- `daily_rewards` - Daily login bonus
- `daily_tasks` - Task completion rewards
- `referral_bonus` - Referral rewards
- `spin_wheel_reward` - Spinner rewards
- `game_reward` - Game win rewards
- `shop_item_purchase` - Shop purchases
- `virtual1_core_conversion` - Swap to blockchain
- `withdraw_pzp` - PZP withdrawal

---

### **3. Game Management Module** (`routes/game.js`, Admin: `adminRoutes/gameRoutes.js`)

**Game Structure:**
```
games {
  id, gameName, serverGameName, keyboardGameName
  url, miniAppUrl, iMessage_Solo
  entryFee (currency required to play)
  currencyType (virtual1|virtual2|free)
  winningCurrencyType (currency earned)
  kills, timeBonus, bossKills (reward multipliers)
}
```

**Key Endpoints:**
- `GET /api/game/list` - List all games
- `GET /api/game/leaderboard` - Weekly/all-time leaderboard
- `POST /api/game/room` - Create game room
- `POST /api/game/submit-score` - Submit game score
- **Admin:** Create, update, delete games

**Reward Calculation:**
```
Reward = baseReward × (kills × timeBonus × bossKills)
```

**Admin Game Management:**
```
POST   /api/admin/game         - Create game
PUT    /api/admin/game/:id     - Update game
DELETE /api/admin/game/:id     - Delete game
GET    /api/admin/game         - List games
GET    /api/admin/game/leaderboard - Leaderboard with date filter
```

---

### **4. Daily Rewards System**

#### **Daily Login Bonus** (`controllers/dailyloginBonus.js`)

**7-Day Cycle:**
- 7 reward tiers (one per day)
- Resets after 7 days
- 24-hour cooldown between claims
- Epoch-based timestamp tracking

**Flow:**
1. User initiates claim
2. Check 24-hour cooldown
3. Check 7-day cycle completion
4. Award reward (virtual1 or virtual2)
5. Update session tracking

**Endpoints:**
- `GET /api/daily-login-bonus/status` - Check claim status
- `POST /api/daily-login-bonus/claim` - Claim reward

---

#### **Daily Tasks** (`controllers/dailyTasks.js`, `routes/earnLudyRoutes.js`)

**Task Management:**
- Admin creates tasks with name, description, icon, redirect link
- Reward range or fixed reward
- Multiple currencies supported
- Status: Active/InActive
- Due date tracking

**User Task Tracking:**
```
DailyUserTasks {
  user_id
  tasks: [
    {
      id, task_name, task_desc, reward, currency_type,
      isClaimed, canClaim, isLocked, isRewarded,
      claimedTimeStamp
    }
  ]
}
```

**Admin Endpoints:**
```
POST   /api/admin/earn-ludy       - Create task
PUT    /api/admin/earn-ludy/:id   - Update task
DELETE /api/admin/earn-ludy/:id   - Delete task
GET    /api/admin/earn-ludy       - List tasks
```

---

### **5. Referral System** (`controllers/referral.js`, `routes/referral.js`)

**Structure:**
```
UserReferral {
  referee (new user)        → referred by referrer
  referrer (existing user)  ← refers new user
  
  refereeAmount   - reward for joining via referral
  referrerAmount  - reward for bringing new user
  redeem          - withdrawal status
}
```

**Flow:**
1. New user enters referral code (base62 encoded user ID)
2. Referral code decoded to verify referrer exists
3. Create UserReferral record
4. Reward both users immediately
5. Mark redeem flag when withdrawn

**Endpoints:**
- `POST /api/referral/join` - Join via referral code
- `GET /api/referral/code` - Get my referral code
- `GET /api/referral/stats` - My referral stats
- `POST /api/referral/redeem` - Redeem referral rewards

---

### **6. Spinner/Wheel System** (`controllers/spinner.js`, `routes/spinner.js`)

**Spin Wheel Rewards:**
```
spin_wheels {
  id, name, is_disabled
  perc (percentage chance)
  virtual1 (reward amount)
  virtual2 (reward amount)
}
```

**User Spin Tracking:**
```
user_spin_wheels {
  user_id, spin_wheel_id
  is_claimed (bool)
  virtual1, virtual2 (awarded amounts)
}
```

**Flow:**
1. User initiates spin
2. Random selection from active wheels
3. Calculate reward based on probability
4. Store user spin record
5. Award currency on claim

**Endpoints:**
- `POST /api/spinner/spin` - Spin wheel
- `GET /api/spinner/result` - Get last spin result
- `POST /api/spinner/claim` - Claim spin reward

---

### **7. Shop & Wallet System** (`controllers/shop.js`, `routes/shop.js`)

**Shop Items:**
```
shopList.json: [
  {
    item_id, name, category
    price (PZP/TON cost)
    quantity (reward amount)
    reward_type (virtual1|virtual2)
  }
]
```

**Key Operations:**

#### **Ticket to PZP Swap** (`ticketConversion`)
- User swaps virtual1 → PZP (core token)
- Check minimum swap amount
- Calculate fee percentage
- Auto-approve transfer
- Update transaction history

#### **Withdrawal** (`withdrawPzpRequest`)
- Create pending withdrawal request
- Store in UserWalletHistory with status="pending"
- Admin approves → transfer to user wallet
- Update transaction hash on blockchain confirmation

#### **User Wallet Creation** (`createUserWallet`)
- Create EVM wallet address
- Create TON wallet address
- Store in Wallets table
- Fund with initial balance if needed

**Transaction States:**
- `pending` - Awaiting processing
- `success` - Completed
- `failed` - Failed or cancelled

**Endpoints:**
- `GET /api/getShopList` - List shop items
- `POST /api/swap/ticket-to-pzp` - Initiate swap
- `POST /api/withdraw` - Request withdrawal
- `POST /api/updateOnchainTransaction` - Update on-chain tx status

**Admin Shop Approval:**
- `GET /api/admin/requests/withdraw` - Withdrawal requests
- `POST /api/admin/approve-withdraw/:id` - Approve withdrawal

---

### **8. Store & Items System** (`controllers/store.js`, `adminRoutes/storeRoutes.js`)

**Store Structure:**
```
StoreItem {
  name (weapon/inventory item)
  type (weapon | inventory)
  price (cost to unlock/upgrade)
  currencyType (virtual1 | virtual2)
  baseLevel (default: 1)
  maxLevel (default: 3)
  levels: [ItemLevel]
}

ItemLevel {
  level (1, 2, 3)
  upgradeCost (cost to upgrade)
  stats {
    damage, armor, speed, etc.
  }
}

UserPurchase {
  userId, itemId
  currentLevel (1-3)
  unlocked (true/false)
}
```

**Flow:**
1. User views store items
2. Purchase item (unlock level 1)
3. Or upgrade item to next level
4. Deduct currency from balance
5. Update UserPurchase record
6. Log activity

**Admin Endpoints:**
```
GET    /api/admin/store/items          - List all items
POST   /api/admin/store/items          - Create item
PUT    /api/admin/store/items/:id      - Update item
DELETE /api/admin/store/items/:id      - Delete item
POST   /api/admin/store/items/:id/levels - Add level
```

---

### **9. Super Powers System** (`controllers/superPowers.js`, `adminRoutes/superPowerRoutes.js`)

**Super Power Structure:**
```
SuperPower {
  name (e.g., "Shield", "Double Damage")
  description
  price (cost to buy)
  icon (image path)
  isActive
}

UserSuperPower {
  userId, superPowerId
  quantity (how many user owns)
}
```

**Features:**
- Purchase with virtual1/virtual2
- Track quantity owned
- Use during gameplay
- Admin can activate/deactivate

**Admin Endpoints:**
```
GET    /api/admin/superpowers          - List all
POST   /api/admin/superpowers          - Create
PUT    /api/admin/superpowers/:id      - Update
DELETE /api/admin/superpowers/:id      - Delete
```

---

### **10. Blockchain Integration**

#### **EVM Wallet Operations**
- Balance checking via Blockpuri API
- PZP token transfers
- Native balance deductions
- Transaction hashing

#### **TON Wallet Operations**
- TON Connect integration
- Wallet connections
- Transaction signing
- Balance verification

**Key Functions:**
- `cryptoMining()` - Blockchain mining rewards
- `transferPzpReward()` - Send PZP to wallet
- `getWalletBalance()` - Check wallet balance
- `transferEvmNativeBalance()` - EVM transfers
- `callWithdrawalAPI()` - Process withdrawals

---

### **11. Airdrop System** (`routes/earnLudyRoutes.js`, `adminRoutes/airdropRoutes.js`)

**Airdrop Season Structure:**
```
airdropSeason {
  name, description
  total_supply (total PZP allocated)
  claimed (currently claimed amount)
  status (In Progress | Coming Soon)
  startDate, endDate
}
```

**Features:**
- Multiple active seasons
- Track claimed vs total supply
- Admin allocation control
- Progress percentage calculation

**Admin Endpoints:**
```
POST   /api/admin/airdrops          - Create airdrop
PUT    /api/admin/airdrops/:id      - Update airdrop
DELETE /api/admin/airdrops/:id      - Delete airdrop
GET    /api/admin/airdrops          - List airdrops
POST   /api/admin/airdrops/allocate - Allocate to users
```

---

### **12. Activity & Transaction Logging**

**Activity Tracking:**
```
activities {
  userId
  activity_type (login, purchase, game, reward, etc.)
  detail (JSON with context)
  refId (reference to related record)
  wallet_history_id (linked transaction)
  createdAt
}
```

**Logged Activities:**
- User login
- Game play
- Purchase/swap
- Reward claim
- Withdrawal
- Account updates

**Utility Function:**
```javascript
logActivity(userId, activityType, detail, refId, walletHistoryId)
```

---

### **13. Weekly Reward Cron** (`utility/weeklyRewardCron.js`)

**Features:**
- Runs automatically via node-cron/node-schedule
- Distributes weekly rewards to users
- Seeds bot scores for testing
- Called manually via `GET /asign-weekly-reward`

**Flow:**
1. Fetch users with streak continuity
2. Calculate weekly reward based on criteria
3. Award to user balance
4. Update reward history
5. Log activity

---

## API Endpoints

### **Authentication APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | None | User signup/login (guest/google/apple/telegram) |
| GET | `/test` | User | Test endpoint (returns balance info) |

---

### **User APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/get-balance` | User | Get user balance (virtual1, virtual2) |
| DELETE | `/` | User | Delete account (soft delete) |

---

### **Game APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/game/list` | None | List all games |
| POST | `/game/room` | User | Create game room/tournament |
| POST | `/game/join-room` | User | Join existing room |
| POST | `/game/submit-score` | User | Submit game score |
| GET | `/game/leaderboard` | User | Get weekly/all-time leaderboard |

---

### **Daily Rewards APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/daily-login-bonus/status` | User | Check if can claim |
| POST | `/daily-login-bonus/claim` | User | Claim daily login reward |

---

### **Daily Tasks APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/daily-tasks` | User | Get user's daily tasks |
| POST | `/daily-tasks/claim/:taskId` | User | Claim task reward |

---

### **Referral APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/referral/code` | User | Get my referral code |
| POST | `/referral/join` | User | Join via referral |
| GET | `/referral/stats` | User | My referral statistics |

---

### **Spinner APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/spinner/spin` | User | Spin wheel |
| GET | `/spinner/result` | User | Get spin result |
| POST | `/spinner/claim` | User | Claim spin reward |

---

### **Shop APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/getShopList` | None | Get shop items |
| POST | `/updateOnchainTransaction` | User | Update on-chain purchase |
| POST | `/swap/ticket-to-pzp` | User | Swap virtual1 to PZP |
| POST | `/withdraw` | User | Request PZP withdrawal |

---

### **Store APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/store/items` | User | List store items (weapons, inventory) |
| POST | `/store/items/:id/buy` | User | Purchase/unlock item |
| POST | `/store/items/:id/upgrade` | User | Upgrade item level |

---

### **Super Powers APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/superpowers/list` | User | List available superpowers |
| POST | `/superpowers/buy/:id` | User | Purchase superpower |
| GET | `/superpowers/my` | User | My owned superpowers |

---

### **Earn Ludy/Tasks APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/earn-ludy` | None | List daily tasks |
| GET | `/airdrops` | None | List airdrop seasons |

---

### **Transaction APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/balance` | User | Get TON/EVM balance |
| POST | `/send-transaction` | User | Send blockchain transaction |
| GET | `/public-key` | User | Get wallet public key |

---

### **Master Data APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/master/:key` | None | Get master data |

---

### **Total Supply APIs** (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/total-supply` | None | Get PZP total supply |

---

### **Admin Dashboard API** (`/api/admin`)

#### **Authentication**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | None | Admin login with email/password/OTP |
| POST | `/setup-2fa` | None | Setup 2FA (QR code) |
| POST | `/logout` | Admin | Admin logout |

---

#### **Dashboard Stats** (`/dashboard`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | Admin | Dashboard overview (with date range) |

**Returns:**
```json
{
  "users": {
    "totalUsers": 1000,
    "activeUsers": 800,
    "inactiveUsers": 150,
    "superUsers": 50,
    "blockedUsers": 10
  },
  "games": {
    "totalGamesPlayed": 5000
  }
}
```

---

#### **User Management** (`/admin/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | List users with filters |
| GET | `/users/:id` | Admin | Get user details |
| PUT | `/users/:id` | Admin | Update user (block/restrict) |
| PUT | `/users/:id/balance` | Admin | Adjust user balance |
| DELETE | `/users/:id` | Super Admin | Delete user |

**Filters:**
- Status (active, inactive, blocked, restricted)
- Role (user, super_user)
- Date range
- Search (username, email)

---

#### **Game Management** (`/admin/game`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/game` | Admin | List games |
| POST | `/game` | Admin | Create game |
| PUT | `/game/:id` | Admin | Update game |
| DELETE | `/game/:id` | Admin | Delete game |
| GET | `/game/leaderboard` | Admin | Leaderboard (date range, pagination) |

**Create/Update Payload:**
```json
{
  "gameName": "Survival Battle",
  "serverGameName": "survival_battle",
  "url": "https://game.com/play",
  "entryFee": 100,
  "currencyType": "virtual1",
  "winningCurrencyType": "virtual2",
  "kills": 1,
  "timeBonus": 1.5,
  "bossKills": 100
}
```

---

#### **Withdrawal Management** (`/admin/requests/withdraw`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/requests/withdraw` | Admin | List withdrawal requests |
| POST | `/approve-withdraw/:id` | Admin | Approve withdrawal |
| POST | `/reject-withdraw/:id` | Admin | Reject withdrawal |

**Query Params:**
- `page`, `perPage` (pagination)
- `status` (pending, success, failed)
- `startDate`, `endDate` (date range)
- `userId`, `id` (filters)

---

#### **Daily Tasks Management** (`/admin/earn-ludy`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/earn-ludy` | Admin | List tasks |
| POST | `/earn-ludy` | Admin | Create task |
| PUT | `/earn-ludy/:id` | Admin | Update task |
| DELETE | `/earn-ludy/:id` | Admin | Delete task |

**Payload:**
```json
{
  "task_name": "Follow Twitter",
  "task_desc": "Follow our Twitter account",
  "task_pfp": "https://...",
  "task_redirect": "https://twitter.com/...",
  "reward": 50,
  "currency_type": "virtual1",
  "status": "Active",
  "due_date": "2024-01-31"
}
```

---

#### **Airdrop Management** (`/admin/airdrops`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/airdrops` | Admin | List airdrop seasons |
| POST | `/airdrops` | Admin | Create airdrop |
| PUT | `/airdrops/:id` | Admin | Update airdrop |
| DELETE | `/airdrops/:id` | Admin | Delete airdrop |
| POST | `/airdrops/allocate` | Admin | Allocate airdrop |

---

#### **Spinner Management** (`/admin/spinner`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/spinner` | Admin | List spin wheels |
| POST | `/spinner` | Admin | Create wheel |
| PUT | `/spinner/:id` | Admin | Update wheel |
| DELETE | `/spinner/:id` | Admin | Delete wheel |

**Payload:**
```json
{
  "name": "Premium Wheel",
  "perc": 25.5,
  "virtual1": 100,
  "virtual2": 50,
  "is_disabled": false
}
```

---

#### **Store Management** (`/admin/store`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/store/items` | Admin | List items |
| POST | `/store/items` | Admin | Create item |
| PUT | `/store/items/:id` | Admin | Update item |
| DELETE | `/store/items/:id` | Admin | Delete item |
| POST | `/store/items/:id/levels` | Admin | Add level |

---

#### **Super Power Management** (`/admin/superpowers`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/superpowers` | Admin | List powers |
| POST | `/superpowers` | Admin | Create power |
| PUT | `/superpowers/:id` | Admin | Update power |
| DELETE | `/superpowers/:id` | Admin | Delete power |

---

#### **Settings Management** (`/admin/settings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/settings` | Admin | Get all settings |
| PUT | `/settings/:key` | Admin | Update setting |

**Master Settings Keys:**
- `maintenance` - Maintenance mode toggle
- `admins` - Whitelist admin IDs
- `minWithdraw` - Minimum withdrawal amount
- `swapFee` - Swap fee percentage
- `ticketMinSwap` - Min swap amount
- `airdropStats` - Airdrop configuration

---

## Admin Dashboard Controls

### **Dashboard Overview**
**URL:** `/admin/dashboard`

**Features:**
- Total users count (all, active, inactive, blocked)
- Super users count
- Total games played
- Super user management
- User status filters
- Date range selection

**Display:**
```
┌─────────────────────────────────────┐
│     Dashboard Overview              │
├─────────────────────────────────────┤
│ Total Users: 1000                   │
│ Active Users: 800                   │
│ Inactive: 150                       │
│ Blocked: 10                         │
│ Super Users: 50                     │
│ Total Games Played: 5000            │
└─────────────────────────────────────┘
```

---

### **User Management Panel**
**URL:** `/admin/users`

**Controls:**
- List users (paginated)
- Search by username/email
- Filter by status (active, inactive, restricted, blocked)
- Filter by role (user, super_user)
- View user details
- Adjust balance (add/remove currency)
- Block/restrict/activate user
- View user activity log
- View user transactions

**Admin Actions:**
- ✅ Block user (status=2)
- ✅ Restrict user (status=1)
- ✅ Activate user (status=0)
- ✅ Adjust virtual1/virtual2
- ✅ Promote to super user
- ✅ View referral info
- ✅ View wallet addresses

---

### **Game Management Panel**
**URL:** `/admin/games`

**Controls:**
- Create new game
- Edit game details (name, entry fee, rewards)
- Delete game
- View leaderboard (with date range & pagination)
- Configure game parameters:
  - Entry fee amount
  - Currency type (virtual1, virtual2, free)
  - Winning currency type
  - Reward multipliers (kills, timeBonus, bossKills)

**Leaderboard View:**
```
Rank | Player      | Score  | Rewards | Date
-----|-------------|--------|---------|-------
  1  | Player#1    | 5000   | 500 PZP | 1/7
  2  | Player#2    | 4800   | 480 PZP | 1/7
  ...
```

---

### **Withdrawal Requests Panel**
**URL:** `/admin/requests/withdraw`

**Controls:**
- View pending withdrawal requests
- Approve/reject withdrawal
- View user details & wallet address
- View transaction history
- Filter by status (pending, approved, rejected)
- Filter by date range
- Search by user ID

**Withdrawal Request Fields:**
- User ID/name
- Amount requested
- Wallet address
- Status (pending/approved/rejected)
- Request date
- Approval date

---

### **Daily Tasks Management Panel**
**URL:** `/admin/tasks`

**Controls:**
- Create new task
- Edit task details
- Delete task
- Set task status (Active/InActive)
- Configure task:
  - Task name & description
  - Icon/image
  - Redirect URL
  - Reward amount/range
  - Currency type
  - Due date

**Task States:**
- Active (visible to users)
- InActive (hidden from users)
- Can be claimed by users when active

---

### **Spinner Configuration Panel**
**URL:** `/admin/spinner`

**Controls:**
- Create spin wheel
- Edit wheel properties
- Delete wheel
- Configure wheel:
  - Name
  - Percentage/probability
  - Virtual1 reward
  - Virtual2 reward
  - Active/disabled status

**Wheel Management:**
- Multiple wheels available
- Users spin once per session
- Random selection from active wheels
- Rewards distributed immediately

---

### **Store/Items Management Panel**
**URL:** `/admin/store`

**Controls:**
- Create store items (weapons, inventory)
- Configure item levels (1-3)
- Set upgrade costs
- Define item stats (JSON)
- Delete items

**Item Configuration:**
- Type (weapon/inventory)
- Base price
- Currency type
- Levels with upgrade progression
- Stats per level (damage, armor, speed, etc.)

---

### **Airdrop Campaign Panel**
**URL:** `/admin/airdrops`

**Controls:**
- Create airdrop season
- Set total supply
- Track claimed amount
- Update campaign status (In Progress/Coming Soon)
- Allocate to specific users
- View progress percentage
- Delete campaign

**Campaign Fields:**
- Season name
- Description
- Total supply (PZP)
- Claimed amount (auto-tracked)
- Start/end date
- Status
- Progress %

---

### **Settings Panel**
**URL:** `/admin/settings`

**Controls:**
- Maintenance mode (on/off)
- Whitelist admin IDs
- Set minimum withdrawal amount
- Set swap fee percentage
- Configure minimum swap amount
- Manage airdrop statistics

**Key Settings:**
```
Key: "maintenance"
Value: { status: true/false }

Key: "admins"  
Value: { ids: [userId1, userId2, ...] }

Key: "minWithdraw"
Value: "100"

Key: "swapFee"
Value: "2.5"  // percentage

Key: "airdropStats"
Value: { additionalSupply: "1M" }
```

---

### **Admin Login Flow**

**Step 1:** Email + Password
```json
POST /api/admin/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Step 2:** QR Code Setup (if 2FA not setup)
```json
Response: {
  "setup": true,
  "qr": "data:image/png;...",
  "secret": "JBSWY3DPEBLW64TMMQ...",
  "message": "Scan QR and confirm Pass key"
}
```

**Step 3:** Confirm 2FA with OTP
```json
POST /api/admin/setup-2fa
{
  "email": "admin@example.com",
  "otp": "123456",
  "secret": "JBSWY3DPEBLW64TMMQ..."
}
```

**Step 4:** Login with OTP (subsequent logins)
```json
POST /api/admin/login
{
  "email": "admin@example.com",
  "password": "password123",
  "otp": "123456"
}
Response: {
  "token": "eyJhbGc...",
  "message": "Login successful"
}
```

---

## Authentication & Authorization

### **JWT Implementation**

**Token Generation:**
```javascript
const token = jwt.sign(
  { userId: 123 },
  process.env.JWT_SECRET,
  { algorithm: "HS256", expiresIn: "7d" }
);
```

**Token Verification:**
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET, {
  algorithms: ["HS256"]
});
```

---

### **Middleware Stack**

#### **UserMiddleware**
- Extracts token from `authentication` header
- Verifies JWT signature
- Checks user existence
- Checks user status:
  - 0 = Active ✅
  - 1 = Restricted ⚠️ (can't play games)
  - 2 = Blocked ❌
  - 3 = Deleted ❌
- Checks maintenance mode (bypassed for admins/super users)
- Sets `req.userId` and `req.user`

#### **AdminMiddleware**
- Extracts token from `authorization` or `authentication` header
- Verifies admin JWT
- Checks admin existence
- Validates admin role

#### **requireRoles**
```javascript
requireRoles([PlayerRole.super_admin, PlayerRole.admin])
```
- Checks if admin has required role
- 0 = Super Admin (all permissions)
- 1 = Admin (limited permissions)
- 2 = Manager
- 3 = Partner

---

### **User Roles & Permissions**

**User Roles:**
- `user` - Regular user
- `super user` - Elevated privileges (bypass maintenance, admin access)

**Admin Roles:**
- `0` (super_admin) - Full control
- `1` (admin) - Manage most resources
- `2` (manager) - Limited management
- `3` (partner) - Read-only access

**Permission Matrix:**

| Feature | User | Super User | Admin | Super Admin |
|---------|------|-----------|-------|------------|
| Play games | ✅ | ✅ | ✅ | ✅ |
| Claim rewards | ✅ | ✅ | ✅ | ✅ |
| View leaderboard | ✅ | ✅ | ✅ | ✅ |
| Manage games | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ✅ |
| Manage airdrop | ❌ | ❌ | ✅ | ✅ |
| Manage admins | ❌ | ❌ | ❌ | ✅ |
| Access during maintenance | ❌ | ✅ | ✅ | ✅ |

---

## Key Features & Workflows

### **User Onboarding Workflow**

```
1. User opens app
   ↓
2. Guest login OR Social login (Google/Apple/Telegram)
   ↓
3. Firebase verification (for Google)
   ↓
4. Create user record in DB
   ↓
5. Create wallet (EVM + TON)
   ↓
6. Grant default store items (level 1 unlock)
   ↓
7. Initialize daily rewards tracking
   ↓
8. Generate JWT token
   ↓
9. Return token to client
   ↓
10. User redirected to dashboard
```

---

### **Game Play Workflow**

```
1. User views games list
   ↓
2. User selects game & clicks "Play"
   ↓
3. Check user balance >= entry fee
   ↓
4. Create game room/tournament
   ↓
5. Deduct entry fee from balance
   ↓
6. Redirect to game URL (Unity/Web)
   ↓
7. User plays game
   ↓
8. Game completes, score submitted
   ↓
9. Calculate reward = baseReward × (kills × timeBonus × bossKills)
   ↓
10. Award winning currency to user
    ↓
11. Create UserGameRewardHistory record
    ↓
12. Log activity
```

---

### **Daily Reward Claim Workflow**

```
1. User opens "Daily Bonus" section
   ↓
2. Check if DailyRewards session exists
   ↓
3. If not, create new session (startAt = now)
   ↓
4. Calculate days since start
   ↓
5. If >= 7 days, reset cycle
   ↓
6. Check 24-hour cooldown since last claim
   ↓
7. If can claim & claim count < 7:
     - Award reward for day (reward[claimedDaysCount])
     - Increment claimedDaysCount
     - Update lastClaimDate = now
   ↓
8. Return { canClaim, nextClaimAt, daysResetIn }
```

---

### **Swap Workflow (Ticket → PZP)**

```
1. User initiates swap request
   ↓
2. Validate minimum swap amount
   ↓
3. Deduct virtual1 from user balance
   ↓
4. Create UserWalletHistory (status=pending)
   ↓
5. Calculate PZP amount after fee:
     PZP = virtual1 × (1 - fee%)
   ↓
6. Call blockchain transfer API
   ↓
7. If success:
     - Update transaction (status=success, hash)
     - Log activity
   ↓
8. If failed:
     - Refund virtual1
     - Update transaction (status=failed)
```

---

### **Withdrawal Workflow**

```
1. User requests withdrawal
   ↓
2. Validate minimum withdrawal amount
   ↓
3. Verify wallet address
   ↓
4. Create pending withdrawal request
   ↓
5. Store in UserWalletHistory (status=pending)
   ↓
6. Admin reviews in dashboard
   ↓
7. Admin clicks "Approve"
   ↓
8. Call blockchain transfer API
   ↓
9. Transfer PZP to wallet
   ↓
10. Update status (success) + hash
    ↓
11. Notify user
```

---

### **Airdrop Allocation Workflow**

```
1. Admin creates airdrop season (total supply = X)
   ↓
2. Users qualify through:
     - Game wins
     - Task completion
     - Referral signups
   ↓
3. Admin clicks "Allocate Airdrop"
   ↓
4. System calculates eligible users
   ↓
5. Distribute PZP from total supply
   ↓
6. Update claimed amount (auto-tracked)
   ↓
7. Calculate progress %
   ↓
8. Log activity & transactions
```

---

## Deployment & Configuration

### **Environment Variables**

```env
# Server
NODE_ENV=production
PORT=2032

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=your_secret_key_here

# Firebase
FIREBASE_PROJECT_ID=project_id
FIREBASE_PRIVATE_KEY=private_key
FIREBASE_CLIENT_EMAIL=email@project.iam.gserviceaccount.com

# Blockchain - EVM
Blockpuri_BaseUrl=https://api.blockpuri.io
Blockpuri_Key=your_blockpuri_key
Authorization=Bearer token
CoreContract_Address=0x...
Bridge_Address=0x...

# Blockchain - TON
TON_ENDPOINT=https://toncenter.com/api/v2

# Encryption
EncryptionKey=your_encryption_key
Base62Key=your_base62_key

# Swagger/API Key
API_KEY=your_api_key
API_CALL_KEY=your_call_key

# Third Party
TELEGRAM_BOT_TOKEN=your_bot_token
MINI_APP_SHORTNAME=your_shortname

# Game URLs
GAME_URL=https://game.example.com
MINI_APP_URL=https://mini.example.com
```

---

### **Database Setup**

```bash
# Install Prisma
npm install @prisma/client prisma

# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# View database in Studio
npm run prisma:studio

# Reset database (dev only!)
prisma migrate reset --force
```

---

### **Running the Server**

```bash
# Development
npm run dev

# Production
npm start

# With nodemon for auto-reload
nodemon index.js
```

---

### **Dashboard Setup**

```bash
cd dashboard

# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

---

### **CORS Configuration**

```javascript
const corsOptions = {
  origin: '*',  // Allow all origins (configure for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'authentication'],
  credentials: false,
};
```

---

### **Cron Jobs**

**Weekly Reward Distribution:**
```
Endpoint: GET /asign-weekly-reward
Schedule: Custom interval (node-cron or node-schedule)
Function: distributeWeeklyRewards()
```

---

## Response Format

### **Standard Response Structure**

```javascript
makeResponse(res, statusCode, success, message, data)

// Example Success Response
{
  "status": 200,
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Example Error Response
{
  "status": 400,
  "success": false,
  "message": "Validation failed",
  "data": null
}
```

**Status Codes:**
- `200` - SUCCESS (operation completed)
- `201` - CREATED (resource created)
- `400` - BAD_REQUEST (validation error)
- `401` - UNAUTHORIZED (invalid token)
- `403` - FORBIDDEN (no permission)
- `404` - NOT_FOUND (resource missing)
- `500` - SERVER_ERROR (unexpected error)
- `503` - MAINTENANCE (server maintenance)

---

## Error Handling

**Async Handler Wrapper:**
```javascript
handleRequest(async (req, res) => {
  // Code here - errors auto-caught
})
```

**Custom Error:**
```javascript
const error = new Error("Custom message");
error.statusCode = 400;
throw error;
```

---

## Localization

**Supported Languages:**
- English (en)
- Spanish (es)
- Indonesian (id)
- Portuguese (pt)
- Brazilian Portuguese (pt_BR)
- Russian (ru)

**Usage:**
```javascript
i18n.changeLanguage('es');
const message = i18n.t('key');
```

---

## Testing Endpoints

### **Quick Test Commands**

```bash
# Test server
curl http://localhost:2032/api/test

# User login
curl -X POST http://localhost:2032/api/login \
  -H "Content-Type: application/json" \
  -d '{"socialId":"123","loginType":"guest"}'

# Get balance
curl http://localhost:2032/api/get-balance \
  -H "authentication: Bearer YOUR_TOKEN"

# Admin login
curl -X POST http://localhost:2032/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pass","otp":"123456"}'

# Get dashboard
curl http://localhost:2032/api/admin/dashboard \
  -H "authorization: Bearer ADMIN_TOKEN" \
  -d '{"startDate":"2024-01-01","endDate":"2024-01-31"}'
```

---

## Common Issues & Debugging

### **Issue: "User not found" after login**
- Check JWT_SECRET matches
- Verify user exists in database
- Check user status (not blocked/deleted)

### **Issue: Admin login fails**
- Verify email & password correct
- Check 2FA setup (OTP)
- Verify admin role configured
- Check admin_login_logs for IP restrictions

### **Issue: Wallet not created**
- Check Blockpuri API connectivity
- Verify EncryptionKey env var
- Check wallet service logs

### **Issue: Game rewards not awarded**
- Verify game entry fee deducted
- Check reward multipliers configured
- Verify user balance update query
- Check transaction status

### **Issue: Maintenance mode blocking users**
- Verify maintenance flag in Master table
- Check user role (super_user bypasses maintenance)
- Verify admin whitelist

---



## Conclusion

PlayZap Survival Backend is a comprehensive gaming platform combining Web3 integration, reward systems, and admin controls. The modular architecture allows easy scaling and feature additions. All APIs are documented and follow REST conventions. Admin dashboard provides complete control over user management, game configuration, and reward distribution.

**Key Strengths:**
- ✅ Modular architecture
- ✅ Comprehensive reward system
- ✅ Blockchain integration ready
- ✅ Role-based access control
- ✅ Multi-language support
- ✅ Activity tracking
- ✅ Scalable database schema

**To Get Started:**
1. Setup `.env` with all required variables
2. Run `npm install && npm run prisma:migrate`
3. Start server: `npm run dev`
4. Access dashboard: `http://localhost:5173`
5. Login as admin with 2FA enabled

