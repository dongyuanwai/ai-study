# 董志洋 Web3 面试准备：基于 GitHub 仓库的整理

核对日期：2026-10-20。核对范围：GitHub 仓库元数据、默认分支目录、相关 README、前端交互代码、核心 Solidity 合约与部署脚本。未运行项目、未验证链上部署，也未进行完整安全审计。仓库存在某段代码不能单独证明它由你独立原创、已经上线或具备生产交付经历。

## 一、适合你的面试主线

结合已有前端、Electron 和 Node.js 开发经历，建议以 **Web3 前端 / DApp 全栈开发**为主要叙述方向。先讲自己能完成的钱包交互与合约调用，再用签名授权、NFT 和 DeFi 练习展示链上知识。合约安全和协议原理作为深入追问的准备内容。

已明确找到 5 个 Web3 相关仓库。前 4 个不是 GitHub 标记的 fork，但仍需区分自己实现、跟练和参考代码；第 5 个明确是训练营 fork。

| 仓库 | 已核对内容 | 面试用途 |
| --- | --- | --- |
| [transfer_web3](https://github.com/dongyuanwai/transfer_web3) | React 与 Next.js 两套前端、ethers 5.7.2、钱包连接、ETH 转账、交易信息记录、Hardhat 合约工程 | 最适合主讲的 DApp 实战 |
| [upchaincamp](https://github.com/dongyuanwai/upchaincamp) | ERC20、ERC721、NFT 市场、Bank、ERC-2612、EIP-712、Vue 交互、AMM、Router、质押、预言机、自动化 | 最丰富的技术复习材料 |
| [web3-exploring](https://github.com/dongyuanwai/web3-exploring) | 手写 ERC20、简化 NFT、SimpleStorage、部署脚本、基础测试、Gas 报告 | Solidity 基础与工程流程 |
| [zero2hero_study](https://github.com/dongyuanwai/zero2hero_study) | LP 质押奖励代码、简单合约转发、OpenZeppelin 升级插件脚本 | 奖励结算与可升级合约 |
| [Web3-Frontend-Bootcamp](https://github.com/dongyuanwai/Web3-Frontend-Bootcamp) | fork 自 openbuildxyz；你的成员目录中只找到报名 readme | 学习背景，不能把课程大纲直接算成项目经历 |

元数据显示，前 4 个仓库最后推送集中在 2023 年，训练营 fork 最后推送在 2024 年。面试前需重新熟悉代码，运行环境和历史部署信息需单独验证。

## 二、主讲项目：转账 DApp

代码入口：

- [React 交互核心 TransactionContext.jsx](https://github.com/dongyuanwai/transfer_web3/blob/main/client/src/context/TransactionContext.jsx)
- [Transactions.sol](https://github.com/dongyuanwai/transfer_web3/blob/main/smart_contract/contracts/Transactions.sol)
- [React 依赖清单](https://github.com/dongyuanwai/transfer_web3/blob/main/client/package.json)
- [Next.js 依赖清单](https://github.com/dongyuanwai/transfer_web3/blob/main/next_client/package.json)
- [Next.js 交互核心](https://github.com/dongyuanwai/transfer_web3/blob/main/next_client/src/context/TransactionContext.jsx)

实际调用链：

1. 通过 `window.ethereum` 获取钱包注入的 Provider。
2. 用 `eth_accounts` 检查已有授权，用 `eth_requestAccounts` 请求连接。
3. 用 ethers v5 的 `Web3Provider` 获取 Signer，再通过地址与 ABI 创建 Contract。
4. 将输入金额通过 `parseEther` 转成 wei。
5. 调用 `eth_sendTransaction`，从用户账户向目标地址发送 ETH。
6. 再调用 `addToBlockchain`，提交另一笔交易，将地址、金额、留言等写入合约。
7. 等待记录交易的 `wait()`，读取并展示历史记录。

### 必须讲清楚的边界

**当前实现的转账与记录是两笔独立交易。** `Transactions.sol` 中的 `addToBlockchain` 只存储数据并发事件，没有执行 ETH 转账，也没有验证对应的付款。前端等待的是第二笔记录交易的回执，第一笔只等待 RPC 返回交易哈希。因此不能描述成“合约原子完成转账并记录”或“历史列表就是经过验证的付款凭证”。

可以这样回答改进方向：如果需求要求付款与记录同时成功，可设计一个 payable 合约入口，在同一笔交易里校验金额、执行转账并发出事件；若保留两笔交易，应分别追踪两笔交易的状态、保存对应交易哈希，并处理付款成功但记录失败等情况。

### 面试官可能追问

- Provider、Signer、Contract 各负责什么？读取链上数据一定要连接钱包吗？
- 钱包连接与签名登录有什么区别？你的项目实现了哪一种？
- 为什么拿到交易哈希不等于交易成功？
- 如果用户拒绝签名、切换账户、切错链、余额不足或交易失败，页面怎么办？
- 为什么金额不能经由 JavaScript Number 随意计算？
- 为什么不应普遍写死 `gas: 0x5208`？目标地址是合约时怎么办？
- 记录越来越多后，`getAllTransactions()` 返回整个数组有什么问题？如何分页或通过事件索引？

### 已看到的改进点

- `parseInt(transaction.amount._hex) / 10**18` 会经过 Number，金额处理应优先使用库提供的单位转换并保留字符串表示。
- 未看到账户切换和网络切换事件的完整处理。
- `isLoading` 在第二笔交易提交后才设置，异常分支没有统一复位。
- 通过整页刷新更新状态，后续可按交易确认结果刷新相关查询。
- Next.js 版本虽然声明了 `use client`，仍在模块顶层读取 `window`，并在初始状态中读取 `localStorage`，应复核服务端预渲染边界。

以上均为静态阅读发现，尚未运行复现。

## 三、第二个重点：签名授权存款

代码入口：

- [Bank.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week3-2/contracts/Bank.sol)
- [Vue 前端 ERC20.vue](https://github.com/dongyuanwai/upchaincamp/blob/main/week4/src/components/ERC20.vue)
- [typedData.js](https://github.com/dongyuanwai/upchaincamp/blob/main/week4/src/typedData.js)

仓库中存在完整的前端签名与合约调用流程：读取 nonce → 生成 deadline → 构造 domain 与 Permit 数据 → `_signTypedData` → 拆分 v/r/s → 调用 `permitDeposit` → Token 的 permit 更新 allowance → Bank 的 deposit 调用 transferFrom。

这部分可以准备成你的第二个项目案例，重点解释为什么需要授权、签名授权改变了哪一步，以及前端如何与合约配合。

必须能回答：

1. `approve` 和 `transferFrom` 分别是谁调用？spender 是谁？
2. EIP-712 与 ERC-2612 分别解决什么问题？
3. nonce 如何约束签名重复使用？deadline 如何限制有效期？
4. chainId 与 verifyingContract 为什么进入签名 domain？
5. 离线签名本身不上链，但执行 permit/deposit 的交易仍需要 Gas；当前前端由用户自己提交这笔交易。
6. Token 不支持 permit 时，前端如何回退到 approve + deposit？
7. 为什么不能将所有 ERC20 的 decimals 都写成 18？

合约复习点：当前 withdraw 先执行 Token 外部调用，再清零 deposited。应理解 Checks-Effects-Interactions 顺序，以及在可能回调或非标准 Token 场景下的重入风险；不能直接断言所有标准 ERC20 都能利用这段代码重入。

## 四、Token 与 NFT

### ERC20

- [手写 ERC20](https://github.com/dongyuanwai/web3-exploring/blob/main/00_ERC20_code-example/ERC.sol)
- [另一份 MyToken 实现](https://github.com/dongyuanwai/upchaincamp/blob/main/week3-1/MyToken.sol)

复习：balanceOf、totalSupply、allowance、approve、transfer、transferFrom、Transfer/Approval 事件，以及 mint/burn 对余额和总量的影响。

能结合自己的代码说出的边界：手写 ERC20 的 mint 对所有调用者开放。如果业务需要受控发行，应补充权限与供应规则。MyToken 的 `_approve` 注释掉了 Approval 事件，应能解释事件对钱包、索引和前端状态同步的作用。

### ERC721 与 NFT 市场

- [ERC721URIStorage NFT](https://github.com/dongyuanwai/upchaincamp/blob/main/week3-1/MyERC721.sol)
- [NFTMarket.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week3-1/NFTMarket.sol)
- [简化 NFT 练习](https://github.com/dongyuanwai/web3-exploring/blob/main/00_base_contract/MyNFT.sol)

区分：`MyERC721.sol` 继承了 ERC721URIStorage；`MyNFT.sol` 是用 mapping 和数组表达所有权的练习，不能仅因文件叫 MyNFT 就说它完整实现了 ERC721 标准。

NFTMarket 实现了 NFT 转入市场合约、记录价格、买家通过 ERC20 支付以及 NFT 转给买家的流程。但没有保存卖家地址，付款流向市场合约，也没有完整的卖家结算与取消挂单流程；不能说成“完整可运营的 NFT 交易市场”。

准备的问题：

- ERC20 与 ERC721 的授权模型有何不同？
- transferFrom 与 safeTransferFrom 有什么区别？
- 合约接收 NFT 为什么需要 IERC721Receiver？
- tokenURI 与 IPFS 存储的分别是什么？图片是否一定在链上？
- 如何设计订单状态、卖家结算、取消挂单和手续费？
- 为什么价格可以由买家传入的 amount 参数单独校验还不够？支付应以什么为准？

## 五、DeFi：理解后再作为深入话题

| 内容 | 代码入口 | 重点 |
| --- | --- | --- |
| 简化 AMM | [MiniSwapPool.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week5_2/contracts/MiniSwapPool.sol) | x·y=k、报价、LP 份额、增减流动性、minAmountOut |
| Router 调用 | [MyTokenMarket.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week5_2/contracts/MyTokenMarket.sol) | WETH 路径、ETH 换 Token、添加流动性、授权 |
| 质押与奖励 | [MasterChef.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week6_1/contracts/MasterChef.sol) | accSushiPerShare、rewardDebt、池子权重、奖励结算 |
| LP 矿池 | [Mining.sol](https://github.com/dongyuanwai/zero2hero_study/blob/main/week2/src/Mining.sol) | rewardPerTokenStored、用户奖励快照、按时间分配 |
| TWAP | [DexUsdOracle.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week5_2/contracts/DexUsdOracle.sol) | 累计价格、时间窗口、精度、更新频率 |
| Chainlink 喂价 | [ETHUSDPrice.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week6_1/contracts/ETHUSDPrice.sol) | latestRoundData、价格精度、更新时间与有效性 |
| 自动执行 | [AutoCollectUpKeep.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week5_1/contracts/AutoCollectUpKeep.sol) | checkUpkeep、performUpkeep、执行时再次校验条件 |

MiniSwapPool 文件明确标注参考来源；Mining 中含 Synthetix 等来源说明。讲述时说明自己实际学习、修改和实现的部分。

优先准备 6 个问题：

1. 为什么大额兑换会产生价格影响？价格影响与滑点容忍度有何不同？
2. LP Token 表示什么？如何按份额赎回资产？
3. 为什么不能只看某一时刻的池子储备报价来做关键定价？TWAP 有何作用和局限？
4. 为什么奖励累计值可以避免每个区块遍历全部用户？
5. ETH 与 WETH 在 Router 路径中是什么关系？
6. 合约为什么通常需要外部交易来触发执行？checkUpkeep 通过后，执行时为什么仍要重新判断？

可以作为复盘案例的具体问题：

- 添加流动性的最小金额参数被设为 0，代码注释明确忽略滑点，并保留剩余资产处理 TODO。
- [week6_1/MyTokenMarket.sol](https://github.com/dongyuanwai/upchaincamp/blob/main/week6_1/contracts/MyTokenMarket.sol) 用全局 `depsited` 记录总额，公开 withdraw 又将资产发给调用者，缺少用户级存款份额核算。应能说明多用户场景为什么不能这样记账。
- 喂价示例只取 price，未见完整的数据新鲜度校验；代码中的历史网络地址也需要在重新运行前核验。

这些代码适合用来解释“练习版如何改成更完整的实现”，不宜直接描述为已完成生产级 DeFi 协议。

## 六、代理与升级：两种代码不要混讲

- [手写 Proxy.sol](https://github.com/dongyuanwai/zero2hero_study/blob/main/week4/contracts/Proxy.sol)
- [部署脚本 01_deploy.ts](https://github.com/dongyuanwai/zero2hero_study/blob/main/week4/scripts/01_deploy.ts)
- [升级脚本 02_deploy.ts](https://github.com/dongyuanwai/zero2hero_study/blob/main/week4/scripts/02_deploy.ts)
- [Base.sol](https://github.com/dongyuanwai/zero2hero_study/blob/main/week4/contracts/Base.sol)

手写 Proxy 通过 `base.setNumber()` 普通外部调用转发，不能称为 delegatecall 代理。它的 getNumber 未返回 base.getNumber 的结果，setBaseAddress 也没有权限控制。

另一条路径是调用 OpenZeppelin upgrades 插件的 deployProxy / upgradeProxy，并读取 ERC1967 实现与管理员地址。这与手写转发合约是两种实现。

脚本指定 `initializer: 'initialize'`，但当前 Base.sol 没有 initialize 函数。面试前应修正并实际验证，再声称这套部署脚本可以直接跑通。

准备：call 与 delegatecall、代理和实现合约各自保存什么、初始化与构造函数的区别、存储布局兼容、升级权限、Transparent 与 UUPS 的区别。后两个属于建议补充复习的知识，不能凭当前仓库认定已实现过。

## 七、ethers 版本差异

你的转账项目明确依赖 ethers 5.7.2，面试时应先说清版本。

| 项目中的 v5 写法 | v6 对应变化 |
| --- | --- |
| ethers.providers.Web3Provider | ethers.BrowserProvider |
| provider.getSigner() | await provider.getSigner() |
| ethers.utils.parseEther | ethers.parseEther |
| BigNumber | 大量整数 API 使用原生 bigint |

本节通过 Context7 获取并核对了 [ethers 官方迁移文档](https://docs.ethers.org/v6/migrating/)和[入门文档](https://docs.ethers.org/v6/getting-started/)。不要把旧项目的 API 当成当前版本的通用写法，也不要不核对依赖就混用两个版本。

## 八、可直接使用的项目介绍

以下稿子需要你根据自己实际完成的部分确认后使用：

> 我之前主要做前端和跨端开发，也做过一些 Web3 方向的个人项目和系统练习。其中一个比较完整的例子是转账 DApp，使用 React、ethers 和 Solidity，实现钱包连接、ETH 转账，以及交易信息的链上记录与展示，也做了 Next.js 版本。
>
> 另外，我做过 ERC20、ERC721 和 NFT 市场相关练习。其中比较有收获的是签名授权存款：前端构造 EIP-712 数据让钱包签名，合约通过 ERC-2612 permit 设置授权，再完成 Token 存款。这个过程让我把钱包签名、授权额度和链上执行之间的关系串了起来。
>
> 我还学习和实践过 AMM、Router 调用、质押奖励、预言机和合约升级。现在希望把已有的前端、Node.js 和工程交付经验应用到 Web3 产品里，重点做好 DApp 的交互、合约集成和异常状态处理。

不要说：多年商业 Web3 开发、独立研发完整交易所、已完成训练营全部 NFT/Uniswap 项目、合约经过安全审计、已有大规模线上用户。当前核对的仓库不足以支持这些说法。

## 九、建议复习顺序

1. **第一轮：转账 DApp。** 不看代码讲完交易链路，并说明两笔交易的边界；复习金额精度、钱包与网络状态、交易回执。
2. **第二轮：ERC20 与 Permit。** 画清 owner → spender → Token → Bank 之间的调用和资产流向，解释每个签名字段。
3. **第三轮：NFT。** 区分简化 NFT 与 ERC721 标准，补全市场订单与卖家结算设计。
4. **第四轮：DeFi。** 手算一次 AMM 兑换和 LP 份额，解释奖励累计值、滑点与预言机。
5. **第五轮：升级与复盘。** 区分普通 call 转发和 delegatecall 代理，修正初始化脚本后验证部署与升级。

如果面试时间很近，先把第一、二轮准备扎实，再准备 NFT 和 DeFi 的基本概念。每个项目都按“解决什么问题 → 调用与资产流向 → 自己完成什么 → 当前限制 → 如何改进”来讲。
