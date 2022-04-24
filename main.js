// 常數儲存的資料不會變動，因此習慣上將首字母大寫以表示此特性
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished',
};

// Symbols: Spade, Heart, Diamond, Club
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png', // 梅花
];

// 和畫面的顯示有關，統一放在Object view
// getCardElement - 負責生成卡片內容，包括花色和數字
// displayCards - 負責選出 #cards 並抽換內容
// this: 誰呼叫這個function，這裡是view
const view = {
  // 顯示牌背(花樣)或牌面(數字)
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`;
  },

  // 顯示牌內部的數字和花色
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1);
    const symbol = Symbols[Math.floor(index / 13)];
    return `
    <p>${number}</p>
    <img src="${symbol}"/>
    <p>${number}</p>
    `;
  },

  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A';
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return number;
    }
  },

  // indexes: 已經洗好的牌組
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards');
    rootElement.innerHTML = indexes
      .map((index) => this.getCardElement(index))
      .join('');
  },

  // 翻牌
  // 點擊一張覆蓋的卡片 → 回傳牌面內容 (數字和花色)
  // 點擊一張翻開的卡片 → 重新覆蓋卡片，意即把牌面內容清除，重新呼叫牌背樣式(背景)
  // ...把傳進去的陣列變成一個一個的值
  // flipCards(1, 2, 3, ...) 可以接收N個參數
  // ...把參數們變成陣列
  // ...cards = [陣列]
  flipCards(...cards) {
    cards.map((card) => {
      if (card.classList.contains('back')) {
        card.classList.remove('back');
        card.innerHTML = this.getCardContent(Number(card.dataset.index));
        return;
      }

      card.classList.add('back');
      card.innerHTML = null;
    });
  },

  // 配對成功的牌
  // ...: rest parameter
  pairCards(...cards) {
    cards.map((card) => {
      card.classList.add('paired');
    });
  },

  // 渲染score
  renderScore(score) {
    document.querySelector('.score').innerHTML = `Score: ${score}`;
  },

  // 渲染次數 tried times
  renderTriedTimes(times) {
    document.querySelector('.tried').innerHTML = `You've tried: ${times} times`;
  },

  // 配對失敗時的動畫效果
  // 卡片class加入wrong類別，加入後動畫就開始跑
  // 監聽器監聽動畫跑完，把卡片class中的wrong移除
  // { once: true } 事件執行一次後，監聽器就被卸載掉，避免佔用瀏覽器的效能
  appendWrongAnimation(...cards) {
    cards.map((card) => {
      card.classList.add('wrong');
      card.addEventListener('animationend', (event) => {
        event.target.classList.remove('wrong'), { once: true };
      });
    });
  },

  // Game Finished
  showGameFinished() {
    const div = document.createElement('div');
    div.classList.add('completed');
    div.innerHTML = `
      <p>Game Completed!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `;
    const header = document.querySelector('#header');
    header.before(div);
  },
};

// model: 集中管理資料
const model = {
  // 暫存牌組，每次翻開都會暫時存入這裡
  revealedCards: [],

  // 檢查兩張牌是否數字相同
  // 相等就回傳 true; 不相等就回傳 false
  isRevealedCardsMatched() {
    return (
      this.revealedCards[0].dataset.index % 13 ===
      this.revealedCards[1].dataset.index % 13
    );
  },

  score: 0,
  triedTimes: 0,
};

// controller: 溝通協調資料model 和顯示view
// 所有動作都由controller指派，view 或 model 等其他元件只有在被 controller 呼叫時，才會動作
const controller = {
  // 初始化狀態
  currentState: GAME_STATE.FirstCardAwaits,

  // 不要讓 controller 以外的內部函式暴露在 global 的區域
  // controller呼叫utility.getRandomNumberArray，避免 view 和 utility 產生接觸
  generateCards() {
    view.displayCards(utility.getRandonNumberArray(52));
  },

  // after clicking, 依照遊戲狀態指派動作
  // 有多個狀態，用switch
  // 不會去點擊已經翻開的卡牌
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return;
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card);
        model.revealedCards.push(card);
        this.currentState = GAME_STATE.SecondCardAwaits;
        break;
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes); // 遊戲次數+1
        view.flipCards(card);
        model.revealedCards.push(card);
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          // 分數+10分
          view.renderScore((model.score += 10));
          // 改變狀態為配對成功 > 兩張牌停在場上且改變樣式(CSS設定) > 清空配對的暫存陣列 > 變回起始狀態
          this.currentState = GAME_STATE.CardsMatched;
          // ...: spread operator
          view.pairCards(...model.revealedCards);
          model.revealedCards = [];
          if (model.score === 260) {
            console.log('showGameFinished');
            this.currentState = GAME_STATE.GameFinished;
            view.showGameFinished();
            return;
          }
          this.currentState = GAME_STATE.FirstCardAwaits;
        } else {
          // 配對失敗
          // 改變狀態為配對失敗 > 兩張牌在場上先停一秒(1秒 = 1000毫秒) > 卡片蓋回 > 清空配對的暫存陣列 > 變回起始狀態
          this.currentState = GAME_STATE.CardsMatchFailed;
          view.appendWrongAnimation(...model.revealedCards);
          // setTimeout第一個參數是function本身
          setTimeout(this.resetCards, 1000);
        }
        break;
    }
    // check
    // console.log('this.currentState', this.currentState);
    // console.log(
    //   'revealedCards',
    //   model.revealedCards.map((card) => card.dataset.index)
    // );
  },

  // 處理配對失敗的卡牌
  resetCards() {
    view.flipCards(...model.revealedCards);
    model.revealedCards = [];
    // 這裡用controller，不是this
    // 如果用this，setTimeout呼叫resetCards的時候，this會指向windows
    // setTimeout是瀏覽器提供的東西
    controller.currentState = GAME_STATE.FirstCardAwaits;
  },
};

// 取用外部資料庫或演算法
const utility = {
  // 洗牌演算法
  getRandonNumberArray(count) {
    const number = Array.from(Array(count).keys());
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index],
      ];
    }
    return number;
  },
};

//
controller.generateCards();

// 在每一張卡片上掛監聽器
// querySelectorAll: Node List
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('click', (event) => {
    controller.dispatchCardAction(card);
  });
});
