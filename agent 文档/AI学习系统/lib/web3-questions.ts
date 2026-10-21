import type { Answer, Difficulty, Question } from "./types";

const sources = {
  javascript: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model",
  typescript: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
  solidityTypes: "https://docs.soliditylang.org/en/latest/types.html",
  soliditySecurity: "https://docs.soliditylang.org/en/latest/security-considerations.html",
  erc20: "https://eips.ethereum.org/EIPS/eip-20",
  erc721: "https://eips.ethereum.org/EIPS/eip-721",
} as const;

function question(
  number: number,
  title: string,
  difficulty: Difficulty,
  category: string,
  tags: string[],
  sourceUrl: string,
  answer: Answer,
): Question {
  return {
    id: `web3-${number}`,
    number,
    title,
    difficulty,
    topicId: "topic-10",
    originalCategory: category,
    tags,
    sourceUrl,
    verifiedAt: "2026-10-19",
    answer,
  };
}

export const web3Questions: Question[] = [
  question(1, "var、let 和 const 有什么区别？", "easy", "JavaScript 基础", ["JavaScript", "作用域", "变量声明"], sources.javascript, {
    core: "`var` 是函数作用域，存在变量提升并允许重复声明；`let` 和 `const` 是块级作用域，声明前处于暂时性死区。`const` 只禁止变量重新赋值，不会自动冻结对象内容。工程中通常默认使用 `const`，确实需要重新赋值时再使用 `let`。",
    oral: "`var` 是函数作用域，而且提升和重复声明容易制造隐蔽问题；`let`、`const` 是块级作用域。我的习惯是默认 `const`，有重新赋值需求才用 `let`。",
    pitfalls: "不要说 `const` 对象完全不可变；对象属性仍然可以修改。",
  }),
  question(2, "什么是 Closure（闭包）？它有哪些用途和风险？", "medium", "JavaScript 基础", ["JavaScript", "闭包", "内存"], "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures", {
    core: "闭包是函数与其声明位置词法环境的组合。外层函数结束后，内部函数仍可访问外层变量。它常用于保存私有状态、函数工厂和回调；如果闭包长期引用大型对象或 DOM，也可能让这些对象无法及时被垃圾回收。",
    oral: "闭包让函数记住定义时的外部变量，即使外层函数已经返回。它适合封装状态，但也要避免长期持有不再需要的大对象。",
    pitfalls: "不要只回答‘函数里面套函数’；关键是内部函数保留了对词法环境的访问。",
  }),
  question(3, "JavaScript 的 Event Loop（事件循环）如何决定同步代码、Promise 和 setTimeout 的执行顺序？", "medium", "JavaScript 异步", ["JavaScript", "Event Loop", "Promise"], sources.javascript, {
    core: "当前调用栈中的同步代码先执行。当前任务结束后，运行时会先清空 Promise 回调、`queueMicrotask` 等微任务，再进入下一项任务，例如 `setTimeout` 回调。因此常见示例 `同步日志 → Promise.then → setTimeout`。`await` 之后的继续执行也通过 Promise 机制排入微任务。",
    oral: "先跑完当前同步调用栈，再清空微任务，最后进入下一项任务。Promise 回调通常会先于同一轮里的 `setTimeout(0)`。",
    pitfalls: "不要机械地说所有异步代码都进入同一个队列；任务和微任务的调度阶段不同。",
  }),
  question(4, "普通函数和箭头函数的 this 有什么区别？", "medium", "JavaScript 基础", ["JavaScript", "this", "箭头函数"], sources.javascript, {
    core: "普通函数的 `this` 主要由调用方式决定，可以通过 `call`、`apply`、`bind` 显式设置。箭头函数没有自己的 `this`，而是捕获定义位置外层的 `this`；它不能作为构造函数，也不能靠 `call` 等方法改变 `this`。",
    oral: "普通函数看怎么调用，箭头函数看在哪里定义。需要对象方法动态接收调用者时要谨慎使用箭头函数。",
    pitfalls: "不要说箭头函数的 `this` 永远指向全局对象；它继承的是词法作用域中的 `this`。",
  }),
  question(5, "JavaScript 的原型链是什么？属性查找过程是怎样的？", "medium", "JavaScript 基础", ["JavaScript", "原型链", "继承"], sources.javascript, {
    core: "读取对象属性时，运行时先检查对象自身；找不到时沿对象的原型继续查找，直到找到属性或到达 `null`。构造函数创建的对象通常以该构造函数的 `prototype` 作为原型。业务代码应优先用 `Object.getPrototypeOf` 检查原型。",
    oral: "原型链是 JavaScript 实现共享属性和继承的机制：先找自身，再逐层找原型，最后到 `null`。",
    pitfalls: "不要混淆构造函数的 `prototype` 属性和实例对象自身的原型。",
  }),
  question(6, "== 和 === 有什么区别？工程中应如何选择？", "easy", "JavaScript 基础", ["JavaScript", "类型转换", "比较"], sources.javascript, {
    core: "`==` 比较前可能执行隐式类型转换，`===` 同时比较类型和值。工程代码通常优先使用 `===`，减少难以察觉的转换。`value == null` 可同时判断 `null` 和 `undefined`，但应遵循团队明确约定。",
    oral: "`==` 会做隐式转换，`===` 不会。除非有明确理由，我会统一使用严格相等。",
    pitfalls: "不要把对象比较理解为内容比较；两个不同对象即使内容相同，严格相等仍为 `false`。",
  }),
  question(7, "Promise.all、allSettled、race 和 any 有什么区别？", "medium", "JavaScript 异步", ["JavaScript", "Promise", "并发"], sources.javascript, {
    core: "`Promise.all` 要求全部成功，任一拒绝就返回拒绝；`allSettled` 等待所有任务结束并保留每项状态；`race` 采用第一个完成的结果，无论成功失败；`any` 采用第一个成功结果，全部失败时才拒绝。组合方法不会自动取消仍在运行的任务，取消网络请求通常还需 `AbortController`。",
    oral: "全成功用 `all`，需要收集所有结果用 `allSettled`，取最先完成用 `race`，取最先成功用 `any`。",
    pitfalls: "`Promise.all` 返回失败后，其他已经启动的请求不会因此自动停止。",
  }),
  question(8, "如何避免没有依赖关系的异步任务被 await 串行执行？", "medium", "JavaScript 异步", ["JavaScript", "await", "并发控制"], sources.javascript, {
    core: "没有数据依赖的任务应先同时启动，再用 `Promise.all` 等待，例如 `const [a, b] = await Promise.all([getA(), getB()])`。如果任务数量很多，还要设置并发上限、超时和取消机制，避免压垮后端或 RPC 节点。",
    oral: "独立请求不要逐个 `await`，可以并发启动；但并发不是越多越好，大批任务要做限流。",
    pitfalls: "不要为了并发把真正有前后依赖的任务放进 `Promise.all`。",
  }),
  question(9, "浅拷贝和深拷贝有什么区别？JSON 序列化为什么不是通用深拷贝？", "easy", "JavaScript 基础", ["JavaScript", "对象", "拷贝"], sources.javascript, {
    core: "浅拷贝只复制第一层属性，嵌套对象仍共享引用；深拷贝递归复制嵌套结构。`JSON.parse(JSON.stringify(value))` 会丢失或改变 `undefined`、`BigInt`、`Date`、`Map` 和循环引用等数据。可根据数据类型使用 `structuredClone` 或业务定制复制。",
    oral: "展开运算符只是浅拷贝。JSON 方案有明显类型损失，现代环境可考虑 `structuredClone`，复杂对象则按业务处理。",
    pitfalls: "不要默认所有对象都能被安全克隆，例如函数和部分宿主对象有额外限制。",
  }),
  question(10, "Debounce（防抖）和 Throttle（节流）有什么区别？", "easy", "JavaScript 工程", ["JavaScript", "防抖", "节流"], sources.javascript, {
    core: "防抖是在连续触发停止一段时间后执行一次，常用于搜索输入；节流是在固定时间窗口内最多执行一次，常用于滚动和拖拽。实现时还要考虑首次立即执行、尾部执行、参数与 `this` 保留以及取消定时器。",
    oral: "防抖关注最后一次触发，节流限制执行频率。搜索框一般防抖，滚动监听一般节流。",
    pitfalls: "不要只背使用场景；应能手写一个保留参数和 `this` 的基础实现。",
  }),
  question(11, "为什么 Web3 金额不应该直接使用 JavaScript number？", "medium", "Web3 前端", ["JavaScript", "BigInt", "Wei", "精度"], sources.javascript, {
    core: "JavaScript `number` 是双精度浮点数，整数超过 `Number.MAX_SAFE_INTEGER` 后可能失真，而链上常用 `uint256`，例如 1 ETH 等于 10^18 Wei。金额应以字符串或 `bigint` 传输和计算，并结合 Token 的 `decimals` 做解析与格式化，不能先转成浮点数。",
    oral: "链上整数经常远超 JavaScript 的安全整数范围，所以底层使用字符串或 `bigint`，展示时再按精度格式化。",
    pitfalls: "不要用 `parseFloat` 处理链上原始金额，也要注意 `JSON.stringify` 不能直接序列化 `bigint`。",
  }),
  question(12, "TypeScript 中 type 和 interface 有什么区别？", "easy", "TypeScript 类型", ["TypeScript", "type", "interface"], sources.typescript, {
    core: "二者都能描述对象结构。`interface` 支持声明合并，常用于公开对象和类接口；`type` 还能直接表示联合、交叉、元组和条件类型。普通对象场景很多时候二者都可用，关键是团队保持一致并根据扩展方式选择。",
    oral: "对象建模两者都行；需要声明合并或面向类的公开契约时偏向 `interface`，需要联合类型等组合能力时用 `type`。",
    pitfalls: "不要绝对化为某一个一定更好，也不要误以为 `interface` 不能扩展类型别名描述的对象结构。",
  }),
  question(13, "any、unknown 和 never 有什么区别？", "easy", "TypeScript 类型", ["TypeScript", "any", "unknown", "never"], sources.typescript, {
    core: "`any` 会绕过类型检查并向后传播风险；`unknown` 表示值暂时未知，使用前必须收窄；`never` 表示不可能出现的值，常用于始终抛错的函数和联合类型穷尽检查。外部输入通常先建模为 `unknown`，再通过验证转为业务类型。",
    oral: "`any` 是关闭检查，`unknown` 是先承认不知道再验证，`never` 表示逻辑上不该到达。",
    pitfalls: "不要用类型断言把 `unknown` 直接强转掉；断言不提供运行时验证。",
  }),
  question(14, "什么是 Type Narrowing（类型收窄）？有哪些常见方式？", "medium", "TypeScript 类型", ["TypeScript", "类型收窄", "类型守卫"], sources.typescript, {
    core: "类型收窄是通过控制流判断把联合或未知类型缩小为具体类型。常见方式包括 `typeof`、`instanceof`、`in`、判别字段、非空判断和返回 `value is Type` 的自定义类型守卫。收窄必须对应真实的运行时检查。",
    oral: "先用运行时条件证明值属于哪个分支，TypeScript 再在该分支里给出更具体的类型。",
    pitfalls: "自定义类型守卫写错时编译器会相信错误结论，因此守卫本身必须经过测试。",
  }),
  question(15, "什么是判别联合？为什么它适合描述交易状态？", "medium", "TypeScript 类型", ["TypeScript", "判别联合", "状态机"], sources.typescript, {
    core: "判别联合让每个状态拥有固定的字面量判别字段和只属于该状态的数据。例如 `pending` 状态要求有交易哈希，`failed` 状态要求有错误。它能从类型层面排除 `loading=true` 却同时存在成功结果等非法组合，并便于完整处理所有状态。",
    oral: "用一个 `status` 字段区分互斥状态，每个分支只携带自己需要的数据，很适合钱包签名和交易确认这种状态机。",
    pitfalls: "不要把所有字段都做成可选，否则仍然能构造出相互矛盾的状态。",
  }),
  question(16, "如何使用 never 检查 switch 是否覆盖了联合类型的全部分支？", "medium", "TypeScript 类型", ["TypeScript", "never", "穷尽检查"], sources.typescript, {
    core: "在 `switch` 的 `default` 分支中把剩余值赋给 `never`。当联合类型已有成员未被处理时，该值不再是 `never`，编译器就会报错。新增交易状态后，遗漏的 UI 分支因此能在编译阶段暴露。",
    oral: "最后把未处理的值交给 `never`，用编译错误保证分支穷尽。",
    pitfalls: "如果提前把值断言成 `never`，就失去了检查意义。",
  }),
  question(17, "TypeScript 泛型解决了什么问题？它和 any 有什么区别？", "easy", "TypeScript 类型", ["TypeScript", "泛型", "类型关系"], sources.typescript, {
    core: "泛型在不知道具体类型时保留输入、输出或多个参数之间的类型关系。例如 `first<T>(items: T[]): T | undefined` 会根据数组元素推断返回类型。`any` 会丢失关系并关闭检查；没有参与任何关系的泛型参数通常没有价值。",
    oral: "泛型不是换个名字的 `any`，而是让调用者传入具体类型，同时让编译器保持各位置之间的约束。",
    pitfalls: "不要为了显得高级给函数添加完全没被使用的类型参数。",
  }),
  question(18, "为什么说 TypeScript 使用 Structural Typing（结构类型）？", "medium", "TypeScript 类型", ["TypeScript", "结构类型", "类型兼容"], "https://www.typescriptlang.org/docs/handbook/type-compatibility.html", {
    core: "TypeScript 主要根据值实际拥有的成员判断兼容性，而不是要求它显式继承或实现同一个声明。只要对象具有目标类型要求的属性，就可能被赋给该类型。这方便 JavaScript 生态的组合，也意味着品牌 ID 等名义语义需要额外建模。",
    oral: "TypeScript 看结构是否满足，而不是看两个对象是不是来自同一个类。",
    pitfalls: "对象字面量还会触发额外属性检查，不要把它与一般变量赋值的兼容规则混为一谈。",
  }),
  question(19, "Partial、Required、Readonly、Pick、Omit 和 Record 分别有什么作用？", "easy", "TypeScript 类型", ["TypeScript", "工具类型", "类型变换"], sources.typescript, {
    core: "`Partial<T>` 把属性变为可选，`Required<T>` 变为必填，`Readonly<T>` 变为只读，`Pick<T, K>` 选取属性，`Omit<T, K>` 排除属性，`Record<K, V>` 构造键到值的对象类型。它们用于从已有模型推导新模型，减少重复定义。",
    oral: "这些工具类型是在现有类型上做常见变换，重点是复用单一数据模型，而不是复制多份相似接口。",
    pitfalls: "`Partial` 和 `Readonly` 默认只处理一层，并不自动递归到深层对象。",
  }),
  question(20, "TypeScript 的 readonly 能保证运行时对象不被修改吗？", "easy", "TypeScript 类型", ["TypeScript", "readonly", "不可变"], sources.typescript, {
    core: "不能。`readonly` 主要约束 TypeScript 编译阶段允许的操作，编译后的 JavaScript 不会因此自动冻结对象。运行时需要浅层冻结可用 `Object.freeze`，深层不可变则需要额外策略；同时要区分只读引用和深层内容不可变。",
    oral: "`readonly` 是类型系统约束，不是运行时安全边界。",
    pitfalls: "不要把 `Readonly<T>` 当成深度不可变，也不要认为它能防止未经过 TypeScript 的代码修改对象。",
  }),
  question(21, "Solidity 中 storage、memory 和 calldata 有什么区别？", "medium", "Solidity 基础", ["Solidity", "storage", "memory", "calldata"], sources.solidityTypes, {
    core: "`storage` 是持久化链上存储，状态修改通常成本高；`memory` 是一次调用期间的临时可修改区域；`calldata` 是外部调用的只读输入区域，常可避免复制。引用类型赋值时还要判断是在复制数据还是建立同一 `storage` 数据的引用。",
    oral: "`storage` 持久化，`memory` 临时可写，`calldata` 是外部只读输入。数据位置同时影响语义和 Gas。",
    pitfalls: "不要说 `calldata` 永远比 `memory` 好；如果需要修改数据或多次构造新内容，仍需结合实际路径选择。",
  }),
  question(22, "Solidity 的 public、external、internal 和 private 有什么区别？", "easy", "Solidity 基础", ["Solidity", "可见性", "权限"], sources.solidityTypes, {
    core: "`public` 可由合约内部和外部调用；`external` 主要供外部调用，内部通常需通过外部调用语义访问；`internal` 可被当前合约及派生合约调用；`private` 仅当前合约可直接访问。可见性是代码访问规则，不等于链上数据保密。",
    oral: "外部接口常用 `external`，需要内外都调可用 `public`，继承层级共享用 `internal`，当前合约限定用 `private`。",
    pitfalls: "`private` 状态仍存在公开链上，不能存放真正的秘密。",
  }),
  question(23, "msg.sender 和 tx.origin 有什么区别？为什么不能用 tx.origin 做权限验证？", "hard", "Solidity 安全", ["Solidity", "msg.sender", "tx.origin", "权限"], sources.soliditySecurity, {
    core: "`msg.sender` 是当前调用层的直接调用者；`tx.origin` 是整笔交易最初的外部账户。如果用户被诱导调用恶意合约，恶意合约再调用目标合约，`tx.origin` 仍是用户地址，从而绕过基于它的授权。权限判断应使用 `msg.sender` 并建立明确的角色控制。",
    oral: "`msg.sender` 看上一跳，`tx.origin` 看交易最初的人。用后者鉴权会被中间恶意合约利用。",
    pitfalls: "不要用 `tx.origin == msg.sender` 作为通用安全方案，它还会破坏智能钱包和账户抽象场景。",
  }),
  question(24, "require、revert、assert 和自定义错误分别适合什么场景？", "easy", "Solidity 基础", ["Solidity", "revert", "错误处理"], sources.solidityTypes, {
    core: "`require` 常检查输入、权限和业务前置条件；`revert` 用于主动终止复杂分支；`assert` 用于理论上不应被破坏的内部不变量。自定义错误可以携带结构化参数，通常比长错误字符串更节省部署和回滚数据成本。失败会回滚当前调用路径产生的状态变化。",
    oral: "外部条件用 `require` 或自定义错误，复杂分支直接 `revert`，内部不变量才用 `assert`。",
    pitfalls: "不要把用户输入错误交给 `assert`，也不要假设回滚会撤销已经发生在独立外部交易中的操作。",
  }),
  question(25, "Solidity 的 view 和 pure 有什么区别？调用它们一定不消耗 Gas 吗？", "easy", "Solidity 基础", ["Solidity", "view", "pure", "Gas"], sources.solidityTypes, {
    core: "`view` 可以读取但不能修改合约状态，`pure` 既不能读取也不能修改状态。用户通过 RPC 在链下模拟调用时通常不发送交易，因此不支付 Gas；但其他合约在链上执行过程中调用它们，仍然会消耗 Gas。",
    oral: "`view` 能读状态，`pure` 连状态也不读；免费只是链下调用的表现，不代表 EVM 执行没有成本。",
    pitfalls: "不要把 `view` 理解为返回结果永远可信；结果仍取决于读取时的链状态和 RPC 节点。",
  }),
  question(26, "receive 和 fallback 有什么区别？", "easy", "Solidity 基础", ["Solidity", "receive", "fallback", "ETH"], sources.solidityTypes, {
    core: "`receive()` 通常在调用数据为空且合约接收 ETH 时执行；没有匹配到函数或调用数据不符合接口时进入 `fallback()`。需要接收 ETH 时相应函数必须声明 `payable`。两者应保持简单，不能假设固定 Gas 补贴在未来环境中永远足够。",
    oral: "空数据收 ETH 优先走 `receive`，找不到匹配函数等情况走 `fallback`。",
    pitfalls: "不要在接收函数里堆积复杂业务，也不要把收到 ETH 当作一定来自正常入口。",
  }),
  question(27, "Solidity Event（事件）有什么作用？合约能否读取过去的事件？", "easy", "Solidity 基础", ["Solidity", "Event", "日志", "索引"], sources.solidityTypes, {
    core: "事件写入交易日志，便于前端监听、链下索引和审计业务动作。`indexed` 参数可作为日志主题提高筛选效率。事件不是合约状态存储，合约代码不能像读取映射那样查询过去日志；需要链上继续使用的数据必须保存在状态中。",
    oral: "事件主要给链下系统消费，适合通知和索引，但不能替代合约需要读取的状态。",
    pitfalls: "前端不能只凭收到事件就忽略链重组和确认数，也不要在事件里泄露自以为私密的数据。",
  }),
  question(28, "为什么 Solidity mapping 不能直接遍历？怎样设计可枚举数据？", "medium", "Solidity 基础", ["Solidity", "mapping", "Gas", "索引"], sources.soliditySecurity, {
    core: "`mapping` 不保存已写入键的列表，因此无法原生枚举所有键。若必须链上遍历，需要额外维护键数组或可枚举集合；大规模查询更常通过事件和链下索引完成。无界循环可能超过区块 Gas 上限，甚至让关键函数永久无法执行。",
    oral: "映射只提供键到值，不记录键集合。可枚举需求要额外保存键，但大数据通常放到链下索引。",
    pitfalls: "删除包含映射的复杂结构时也要谨慎，不能想当然地认为内部映射记录已被逐项清除。",
  }),
  question(29, "什么是 Reentrancy（重入攻击）？如何防御？", "hard", "Solidity 安全", ["Solidity", "重入", "CEI", "安全"], sources.soliditySecurity, {
    core: "合约在自身状态尚未完成更新时调用外部合约，外部合约可能回调原函数并重复提款或修改状态。常用防御包括 Checks-Effects-Interactions（先检查、再更新状态、最后外部交互）、重入锁、提款模式以及减少外部调用。重入风险来自任何外部合约调用，不只 ETH 转账。",
    oral: "核心问题是把控制权交出去时自己的账还没记完。先改状态再外调，并在必要时加重入锁。",
    pitfalls: "加了重入锁不代表业务就安全，还需考虑跨函数、跨合约重入以及依赖合约状态被间接修改。",
  }),
  question(30, "call、send 和 transfer 有什么区别？发送 ETH 时应注意什么？", "hard", "Solidity 安全", ["Solidity", "call", "ETH", "重入"], sources.soliditySecurity, {
    core: "`call{value: amount}(\"\")` 返回成功标志并通常转发更多 Gas，灵活但会把控制权交给接收方；`send` 返回布尔值，`transfer` 失败时回滚，二者依赖有限 Gas 补贴，可能因接收方逻辑或 Gas 成本变化而失败。现代代码常用 `call`、检查返回值并结合 CEI 和重入防护；批量分发更适合让接收者主动提款。",
    oral: "现在常用 `call` 并检查结果，但必须先更新状态、防重入。不要依赖 `transfer` 的固定 Gas 假设。",
    pitfalls: "不要忽略低级调用返回的 `false`，也不要在循环里让任意一个收款方阻塞所有人。",
  }),
  question(31, "Solidity 0.8 之后还需要考虑整数溢出吗？", "medium", "Solidity 安全", ["Solidity", "溢出", "unchecked", "精度"], sources.solidityTypes, {
    core: "Solidity 0.8 起普通整数算术默认检查溢出和下溢，发生时回滚；`unchecked` 块会关闭这些检查并产生环绕行为。默认检查仍不能解决单位换算、整数除法舍入、类型转换截断和因回滚导致的拒绝服务等业务问题。",
    oral: "默认算术会检查溢出，但 `unchecked`、强制类型转换和精度逻辑仍需审计。",
    pitfalls: "不要沿用旧版本结论说所有运算都必须依赖 SafeMath，也不要因此忽略数值边界测试。",
  }),
  question(32, "什么是 delegatecall？为什么代理升级中容易出现安全问题？", "hard", "Solidity 安全", ["Solidity", "delegatecall", "代理", "升级"], sources.soliditySecurity, {
    core: "`delegatecall` 执行目标合约的代码，但使用调用方的地址、余额和存储上下文。代理合约因此能把逻辑委托给实现合约，同时保留自己的状态。风险包括存储布局冲突、初始化函数重复调用、升级权限失控和实现合约恶意代码。升级时必须保持布局兼容并严格保护管理员路径。",
    oral: "代码来自实现合约，状态写在代理合约。正因为代码能改写代理存储，所以布局和升级权限是安全核心。",
    pitfalls: "不要说升级只是替换地址；还要处理初始化、实现合约锁定、存储槽和治理流程。",
  }),
  question(33, "什么是 Front-running（抢跑）和 MEV？有哪些缓解方式？", "hard", "Solidity 安全", ["Solidity", "MEV", "抢跑", "交易顺序"], sources.soliditySecurity, {
    core: "待打包交易的内容和费用通常可被观察，其他参与者或区块构建者可能调整顺序，在目标交易前后插入交易获利。缓解方案包括提交—揭示、批量竞价、滑点和截止时间、私有交易通道，以及让业务结果尽量不依赖单笔交易的先后顺序。",
    oral: "公开交易在确认前可能被看见和重排，所以要控制滑点、有效期，并在高价值场景采用隐藏意图或批量结算。",
    pitfalls: "提高 Gas 只能参与排序竞争，不是协议层防御；还要考虑三明治攻击和跨区块策略。",
  }),
  question(34, "为什么不能直接用 block.timestamp 或区块哈希生成高价值随机数？", "hard", "Solidity 安全", ["Solidity", "随机数", "预言机", "安全"], sources.soliditySecurity, {
    core: "链上输入公开且部分区块属性可被生产者在一定范围内影响，攻击者还可以根据结果选择是否执行交易，因此简单哈希并不等于不可预测随机数。高价值场景可采用提交—揭示、可验证随机函数、可信随机服务或多方共同生成，并处理回调失败与超时。",
    oral: "链上数据不是秘密，区块生产者还可能影响部分输入，所以不能把时间戳哈希当安全随机数。",
    pitfalls: "不要只把多个可预测值拼接后哈希；信息熵没有因此自动增加。",
  }),
  question(35, "ERC-20 中 approve、allowance 和 transferFrom 如何配合？", "medium", "Token 标准", ["Solidity", "ERC-20", "approve", "allowance"], sources.erc20, {
    core: "Token 持有人先用 `approve(spender, amount)` 设置授权额度，被授权方随后用 `transferFrom(owner, recipient, amount)` 转移资产并消耗 `allowance`。工程上要处理 Token 精度、过大授权风险、非标准返回行为以及修改已有授权可能产生的竞态。",
    oral: "`approve` 给额度，`transferFrom` 在额度内代扣。前端要把授权和实际交易当成两个独立状态处理。",
    pitfalls: "授权成功不代表后续交易一定成功，也不要默认所有 Token 都严格遵循同一种返回值行为。",
  }),
  question(36, "ERC-721 的 transferFrom 和 safeTransferFrom 有什么区别？", "medium", "Token 标准", ["Solidity", "ERC-721", "NFT", "安全转账"], sources.erc721, {
    core: "`safeTransferFrom` 在接收者是合约时会检查其是否实现正确的 NFT 接收接口，避免资产被发送到无法处理 NFT 的合约；`transferFrom` 不进行该检查。接收合约回调本身也是一次外部调用，需要考虑重入和状态更新顺序。",
    oral: "安全转账会确认合约接收方真的能接 NFT，普通转账不会，所以 NFT 可能被永久锁住。",
    pitfalls: "不要因为使用了 `safeTransferFrom` 就忽略接收回调触发的外部调用风险。",
  }),
  question(37, "用户点击购买链上游戏道具后，前端应该管理哪些交易状态？", "medium", "Web3 前端", ["Web3", "前端", "状态机", "交易"], sources.typescript, {
    core: "至少区分未连接钱包、网络检查、准备交易、等待签名、已广播、等待确认、成功和失败。失败还应细分用户拒绝、余额不足、Gas 估算失败、合约回滚、RPC 异常、交易替换和超时。使用 TypeScript 判别联合能让每个状态携带正确的数据。",
    oral: "链上交互不是一个 `loading`，而是一条状态机；签名、广播和确认是三个不同阶段，错误也要可解释。",
    pitfalls: "交易 Hash 出现后不能立即展示成功，也不能在组件卸载或账户切换后继续写入旧状态。",
  }),
  question(38, "用户切换钱包账户或网络时，Web3 前端应该怎样处理？", "medium", "Web3 前端", ["Web3", "钱包", "账户", "网络切换"], sources.javascript, {
    core: "重新读取账户与 Chain ID，清理绑定旧账户的缓存和未完成视图状态，重建或重新配置客户端，校验目标网络，并重新查询余额、授权和游戏资产。异步请求应绑定账户与网络快照，返回时再次确认上下文仍一致，避免旧请求覆盖新页面。",
    oral: "账户或网络一变，就把它当作用户上下文已经更换：清缓存、重建客户端并重新取数。",
    pitfalls: "不要只改页面顶部地址；余额、授权、合约地址和正在等待的交易都可能属于旧网络。",
  }),
  question(39, "前端获得交易 Hash 是否代表交易已经成功？", "medium", "Web3 前端", ["Web3", "交易哈希", "Receipt", "确认"], sources.solidityTypes, {
    core: "不代表。Hash 通常只说明交易已签名或广播。前端还要等待 Receipt（交易回执），检查执行状态、所在区块和所需确认数，并处理交易被替换、长时间未确认、节点暂时不同步以及链重组。最终成功条件应由业务所需的确认深度决定。",
    oral: "Hash 是追踪编号，不是成功证明。要等回执并检查状态，重要资产还要等一定确认数。",
    pitfalls: "不要只监听一个事件就永久标记成功；事件也可能随链重组被移除。",
  }),
  question(40, "链上状态与后端数据库不一致时，系统应该怎样处理？", "hard", "Web3 前端", ["Web3", "索引", "一致性", "链重组"], sources.soliditySecurity, {
    core: "先明确权威来源：资产所有权等关键事实通常以目标链的已确认状态为准，数据库是索引、缓存或业务补充。系统应记录区块高度与哈希、采用幂等事件处理、等待适当确认数、能回滚链重组产生的索引结果，并在 UI 展示待确认或同步中，而不是静默给出矛盾数据。",
    oral: "链上是关键资产事实来源，数据库负责提高查询效率；索引必须带区块信息、可幂等重放并能处理重组。",
    pitfalls: "不要简单地定时覆盖数据库，也不要假设一次读到的最新区块永远不会变化。",
  }),
];
