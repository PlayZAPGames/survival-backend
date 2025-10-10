import prisma from "../prisma/db.js"

export async function insertDefaults() {
  const masterDefaults = [
    {
      key: "referralShareText",
      data1: { text: "Let’s earn more together in upcoming Airdrop! 🎁 Get 50 Gems as welcome gift 💰 Join NOW to maximize your rewards" },
    },
    {
      key: "referral",
      data1: {
        virtual1: { referreeReward: 30, referrerReward: 100 }, referrerDailyRewardLimit: 2000
      }
    },
    {
      key: "airdropStats",
      data1: {
        totalCommunity: "140 M"
      }
    },
    {
      key: "ticketSwapFee",
      data2: "10",
    },
    {
      key: "joinReward",
      data1: {
        virtual1: 50,
        virtual2: 0
      }
    },
    {
      key: "gemToPzp",
      data2: "5"
    },
    {
      key: "admins",
      data1: {
        ids: []
      }
    },
    {
      key: "maintenance",
      data1: {
        data: {
          status: false
        }
      }
    },
    {
      key: "walletWithdraw",
      data1: {
        day_limit: 500,
        min_withdraw: 300,
        processing_fee: 5,
        withdraw_maintenance: false
      }
    },
    {
      key: "swap",
      data1: {
          core_to_bsc_day_limit: 300,
          bsc_to_core_day_limit: 1000,
          min_swap: 1,
          core_to_bsc_processing_fee: 2,
          bsc_to_core_processing_fee: 0,
          swap_maintenance: false
      }
    },
    {
      key: "ticketSwapLimit",
      data2: "500"
    },
    {
      key: "ticketMinSwap",
      data2: "300"
    },
    {
      key: "DailyRewardValues",
      data1: {
        days: [
          { value: 25, currencyType: "virtual1" },
          { value: 50, currencyType: "virtual1" },
          { value: 75, currencyType: "virtual1" },
          { value: 100, currencyType: "virtual1" },
          { value: 150, currencyType: "virtual1" },
          { value: 200, currencyType: "virtual1" },
          { value: 300, currencyType: "virtual1" },
        ],
      }
    },
    {
      key: "spinInterval",
      data1: 12
    },
    {
      key: "weeklyPrizePool",
      data1: {
        rewards: [
          { "from": 1, "to": 1, "reward": 10 },
          { "from": 2, "to": 2, "reward": 9 },
          { "from": 3, "to": 3, "reward": 8 },
          { "from": 4, "to": 6, "reward": 7 },
          { "from": 7, "to": 10, "reward": 6 },
          { "from": 11, "to": 13, "reward": 5 },
          { "from": 14, "to": 20, "reward": 4 },
          { "from": 21, "to": 30, "reward": 3 },
          { "from": 31, "to": 40, "reward": 2 },
          { "from": 41, "to": 50, "reward": 1.5 },
          { "from": 51, "to": 60, "reward": 1 }
        ]
      }
    },
  ];

  // ✅ Insert Daily Tasks
  const dailyTasks = [
    {
      task_name: "Play & Win",
      task_desc: "Play games and earn $LUDY for each win. Higher stakes games offer bigger rewards!",
      reward: 0,
      reward_range: "10-50 $LUDY",
      currency_type: "virtual1",
      status: "Active",
      task_pfp: "https://cdn-icons-png.flaticon.com/512/919/919278.png", // Replace with actual icon if available
      task_redirect: "/games"
    },
    {
      task_name: "Invite Friends",
      task_desc: "Earn $LUDY for each friend who joins using your referral code and plays their first game.",
      reward: 100,
      reward_range: null,
      currency_type: "virtual1",
      status: "Active",
      task_pfp: "https://cdn-icons-png.flaticon.com/512/595/595067.png", // Replace with actual icon
      task_redirect: "/invite"
    },
    {
      task_name: "Spin the Wheel",
      task_desc: "Spin the wheel once daily for a chance to win $LUDY tokens and other rewards!",
      reward: 0,
      reward_range: "5-500 $LUDY",
      currency_type: "virtual1",
      status: "Active",
      task_pfp: "https://cdn-icons-png.flaticon.com/512/1038/1038205.png", // Replace with actual icon
      task_redirect: "/spin"
    },
    {
      task_name: "Login Bonus",
      task_desc: "Log in daily to earn $LUDY. Consecutive logins increase your rewards!",
      reward: 0,
      reward_range: "1-7 Days Streak",
      currency_type: "virtual1",
      status: "Active",
      task_pfp: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png", // Replace with actual icon
      task_redirect: "/login-bonus"
    },
    {
      task_name: "Follow on X",
      task_desc: "Follow our official X account to earn a one-time reward of 100 $LUDY tokens.",
      reward: 100,
      reward_range: null,
      currency_type: "virtual1",
      status: "Active",
      task_pfp: "https://cdn.discordapp.com/attachments/1259807072975978560/1290548488895205376/twitter-x-icon.png",
      task_redirect: "https://x.com/LudoRoyale"
    },
    {
      task_name: "Join Telegram",
      task_desc: "Join our Telegram community to earn a one-time reward of 100 $LUDY tokens.",
      reward: 100,
      reward_range: null,
      currency_type: "virtual1",
      status: "Active",
      task_pfp: "https://cdn.discordapp.com/attachments/1259807072975978560/1290548437544337450/telegram-icon.png",
      task_redirect: "https://t.me/PlayZapOfficial"
    }
  ];

  const gameDefaults = [
    {
      gameName: "2 min",
      serverGameName: "",
      keyboardGameName: "",
      url: "",
      miniAppUrl: "",
      iMessage_Solo: "",
      entryFee: 0,
      currencyType: "free",
      winningCurrencyType: "virtual1",
      coins: 5,
      timeBonus: 2,
    },
    {
      gameName: "10 min",
      serverGameName: "",
      keyboardGameName: "",
      url: "",
      miniAppUrl: "",
      iMessage_Solo: "",
      entryFee: 0,
      currencyType: "free",
      winningCurrencyType: "virtual1",
      coins: 5,
      timeBonus: 2,
    }
  ];

  // ✅ Insert Spin Wheel Defaults
  const spinWheelDefaults = [
    {
      name: "1",
      is_disabled: false,
      perc: 50,
      virtual1: 50,
      virtual2: 0
    },
    {
      name: "2",
      is_disabled: false,
      perc: 30,
      virtual1: 100,
      virtual2: 0
    },
    {
      name: "3",
      is_disabled: false,
      perc: 8,
      virtual1: 200,
      virtual2: 0
    },
    {
      name: "4",
      is_disabled: false,
      perc: 6,
      virtual1: 500,
      virtual2: 0
    },
    {
      name: "5",
      is_disabled: false,
      perc: 3.50,
      virtual1: 750,
      virtual2: 0
    },
    {
      name: "6",
      is_disabled: false,
      perc: 1.75,
      virtual1: 1000,
      virtual2: 0
    },
    {
      name: "7",
      is_disabled: false,
      perc: 0.50,
      virtual1: 1500,
      virtual2: 0
    },
    {
      name: "8",
      is_disabled: false,
      perc: 0.25,
      virtual1: 2000,
      virtual2: 0
    }
  ];


  const storeDefaults = [
    // ⚔️ Weapons
    {
      name: "Iron Sword",
      description: "A basic sword forged from iron. Reliable and sturdy.",
      type: "WEAPON",
      currencyType: "virtual1",
      baseLevel: 1,
      maxLevel: 3,
      levels: [
        { level: 1, upgradeCost: 100, stats: { attack: 10, speed: 1.0 } },
        { level: 2, upgradeCost: 200, stats: { attack: 15, speed: 1.1 } },
        { level: 3, upgradeCost: 400, stats: { attack: 20, speed: 1.2 } },
      ],
    },
    {
      name: "Long Bow",
      description: "Lightweight bow designed for quick ranged attacks.",
      type: "WEAPON",
      currencyType: "virtual1",
      baseLevel: 1,
      maxLevel: 3,
      levels: [
        { level: 1, upgradeCost: 120, stats: { attack: 8, range: 15 } },
        { level: 2, upgradeCost: 240, stats: { attack: 12, range: 18 } },
        { level: 3, upgradeCost: 480, stats: { attack: 16, range: 20 } },
      ],
    },
    {
      name: "Plasma Blaster",
      description: "A futuristic weapon firing concentrated plasma bolts.",
      type: "WEAPON",
      currencyType: "virtual1",
      baseLevel: 1,
      maxLevel: 3,
      levels: [
        { level: 1, upgradeCost: 300, stats: { attack: 25, fireRate: 1.5 } },
        { level: 2, upgradeCost: 600, stats: { attack: 35, fireRate: 1.8 } },
        { level: 3, upgradeCost: 1000, stats: { attack: 50, fireRate: 2.0 } },
      ],
    },

    // 🛡️ Armors
    {
      name: "Leather Armor",
      description: "Basic armor offering minimal protection.",
      type: "ARMOR",
      currencyType: "virtual1",
      baseLevel: 1,
      maxLevel: 3,
      levels: [
        { level: 1, upgradeCost: 80, stats: { defense: 5, weight: 2 } },
        { level: 2, upgradeCost: 160, stats: { defense: 8, weight: 2.2 } },
        { level: 3, upgradeCost: 300, stats: { defense: 12, weight: 2.5 } },
      ],
    },
    {
      name: "Steel Armor",
      description: "Heavy armor that provides excellent protection.",
      type: "ARMOR",
      currencyType: "virtual1",
      baseLevel: 1,
      maxLevel: 3,
      levels: [
        { level: 1, upgradeCost: 150, stats: { defense: 10, weight: 4 } },
        { level: 2, upgradeCost: 300, stats: { defense: 15, weight: 4.5 } },
        { level: 3, upgradeCost: 500, stats: { defense: 20, weight: 5 } },
      ],
    },
    {
      name: "Energy Shield",
      description: "A high-tech shield that absorbs energy attacks.",
      type: "ARMOR",
      currencyType: "virtual1",
      baseLevel: 1,
      maxLevel: 3,
      levels: [
        { level: 1, upgradeCost: 200, stats: { defense: 12, energyResist: 5 } },
        { level: 2, upgradeCost: 400, stats: { defense: 18, energyResist: 10 } },
        { level: 3, upgradeCost: 700, stats: { defense: 25, energyResist: 15 } },
      ],
    },
  ];



  for (const item of masterDefaults) {
    const existing = await prisma.master.findUnique({
      where: { key: item.key }
    });

    // Only insert if the record doesn't exist
    if (!existing) {
      await prisma.master.create({
        data: item
      });
    }
  }

  for (const task of dailyTasks) {
    const exists = await prisma.dailyTasksValues.findFirst({
      where: {
        task_name: task.task_name,
      }
    });

    if (!exists) {
      await prisma.dailyTasksValues.create({
        data: task
      });
    }
  }

  for (const wheel of spinWheelDefaults) {
    const exists = await prisma.spin_wheels.findFirst({
      where: {
        name: wheel.name
      }
    });

    if (!exists) {
      await prisma.spin_wheels.create({
        data: wheel
      });
    }
  }


  for (const game of gameDefaults) {
    const exists = await prisma.games.findFirst({
      where: {
        gameName: game.gameName,
      },
    });

    if (!exists) {
      await prisma.games.create({
        data: game,
      });
    }
  }

   for (const item of storeDefaults) {
    const exists = await prisma.storeItem.findFirst({
      where: { name: item.name, type: item.type },
    });

    if (!exists) {
      await prisma.storeItem.create({
        data: {
          ...item,
          // 👇 convert plain levels array to Prisma nested create syntax
          levels: { create: item.levels },
        },
      });
      console.log(`✅ Inserted: ${item.name}`);
    } else {
      console.log(`⚠️ Already exists: ${item.name}`);
    }
  }
  console.log("✅ Default master records ensured.");
}
